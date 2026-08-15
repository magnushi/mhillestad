import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { PERSONAS, ENABLED_PERSONAS, type Persona } from '../../lib/personas';
import { getOutline, outlineBlock } from '../../lib/knowledgeBase';

export const prerender = false;

const MODEL = 'claude-haiku-4-5';
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 2000;
const MAX_PAUSE_CONTINUATIONS = 4;

// Basic per-IP throttle: the site has no login, so cap request volume.
const RATE_LIMIT = 8; // requests
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

interface TranscriptMessage {
  speaker: 'user' | Persona['id'];
  text: string;
}

function env(name: string): string | undefined {
  return (import.meta.env[name] as string | undefined) ?? process.env[name] ?? undefined;
}

function toApiMessages(
  transcript: TranscriptMessage[],
  agentId: Persona['id'],
): Anthropic.Beta.BetaMessageParam[] {
  return transcript.map((m) => {
    if (m.speaker === agentId) {
      return { role: 'assistant' as const, content: m.text };
    }
    const label = m.speaker === 'user' ? 'Visitor' : PERSONAS[m.speaker].name;
    return { role: 'user' as const, content: `[${label}]: ${m.text}` };
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: 'Server is not configured yet (missing ANTHROPIC_API_KEY).' }, 503);
  }

  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {
    // clientAddress can throw in some adapters; fall through to 'unknown'
  }
  if (rateLimited(ip)) {
    return json({ error: 'Too many requests. Please slow down a little.' }, 429);
  }

  let transcript: TranscriptMessage[];
  try {
    const body = await request.json();
    transcript = body?.messages;
    if (
      !Array.isArray(transcript) ||
      transcript.length === 0 ||
      transcript.length > MAX_MESSAGES ||
      transcript[0].speaker !== 'user' ||
      transcript[transcript.length - 1].speaker !== 'user' ||
      !transcript.every(
        (m) =>
          (m.speaker === 'user' || m.speaker in PERSONAS) &&
          typeof m.text === 'string' &&
          m.text.length > 0 &&
          m.text.length <= MAX_MESSAGE_CHARS,
      )
    ) {
      throw new Error('invalid');
    }
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const client = new Anthropic({ apiKey });
  const mcpUrl = env('SANITY_MCP_URL');
  const mcpToken = env('SANITY_MCP_TOKEN');
  const mcpAvailable = Boolean(mcpUrl && mcpToken);
  // The knowledge base is required: without it the experts do not answer at
  // all. KB_OPTIONAL=true is a local-development escape hatch only — do not
  // set it in production.
  const kbOptional = env('KB_OPTIONAL') === 'true';
  if (!mcpAvailable && !kbOptional) {
    return json({ error: 'The knowledge base is not configured, so the experts cannot answer.' }, 503);
  }

  // Preloaded once per instance; null falls back to the model fetching it.
  const outline = mcpAvailable ? await getOutline(mcpUrl!, mcpToken!) : null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // A moderator decides which expert(s) answer this message and in
        // which order; each speaker sees any earlier speaker's fresh reply.
        // With a single enabled persona the moderator is skipped entirely.
        const speakers =
          ENABLED_PERSONAS.length === 1
            ? [...ENABLED_PERSONAS]
            : await chooseSpeakers(client, transcript);
        for (const agentId of speakers) {
          const persona = PERSONAS[agentId];
          send({ type: 'speaker', speaker: persona.id, name: persona.name });
          const text = await streamAgentReply(client, persona, transcript, {
            mcpUrl,
            mcpToken,
            mcpAvailable,
            kbOptional,
            outline,
            send,
          });
          transcript.push({ speaker: persona.id, text });
          send({ type: 'agent_done', speaker: persona.id });
        }
        send({ type: 'done' });
      } catch (err) {
        console.error('chat stream failed:', err);
        const message = /mcp/i.test(String(err))
          ? 'The knowledge base is unreachable, so the experts cannot answer right now. Please try again later.'
          : 'The experts were interrupted. Please try again.';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};

const MODERATOR_SYSTEM = `
You are the silent moderator of a public chat where a visitor talks with these
experts:
${ENABLED_PERSONAS.map((id) => `- "${id}" — ${PERSONAS[id].name}: ${PERSONAS[id].title}.`).join('\n')}

Decide who should answer the visitor's latest message.
- Pick ONE expert when the message clearly belongs to their domain, or when
  the visitor addresses that expert directly or asks them a follow-up.
- Pick SEVERAL (in the order they should speak) only when the message
  genuinely spans their domains — parallels between the eras, comparisons, or
  an open invitation to discuss.
- Greetings or meta questions about the site: pick one expert, alternating
  fairly based on who spoke less recently.
Respond with JSON only.`;

const MODERATOR_SCHEMA = {
  type: 'object',
  properties: {
    speakers: {
      type: 'array',
      items: { type: 'string', enum: [...ENABLED_PERSONAS] },
    },
  },
  required: ['speakers'],
  additionalProperties: false,
};

async function chooseSpeakers(
  client: Anthropic,
  transcript: TranscriptMessage[],
): Promise<Persona['id'][]> {
  const recent = transcript
    .slice(-10)
    .map((m) => {
      const label = m.speaker === 'user' ? 'Visitor' : PERSONAS[m.speaker].name;
      return `[${label}]: ${m.text}`;
    })
    .join('\n');
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: MODERATOR_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Conversation so far:\n${recent}\n\nWho should answer the visitor's latest message?`,
        },
      ],
      output_config: { format: { type: 'json_schema', schema: MODERATOR_SCHEMA } },
    });
    const text = res.content.find((b) => b.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text) as { speakers?: string[] };
    const speakers = [
      ...new Set(
        (parsed.speakers ?? []).filter((s): s is Persona['id'] =>
          (ENABLED_PERSONAS as string[]).includes(s),
        ),
      ),
    ];
    return speakers.length > 0 ? speakers : [...ENABLED_PERSONAS];
  } catch (err) {
    console.warn('moderator failed, defaulting to all enabled experts:', err);
    return [...ENABLED_PERSONAS];
  }
}

async function streamAgentReply(
  client: Anthropic,
  persona: Persona,
  transcript: TranscriptMessage[],
  ctx: {
    mcpUrl?: string;
    mcpToken?: string;
    mcpAvailable: boolean;
    kbOptional: boolean;
    outline: string | null;
    send: (data: Record<string, unknown>) => void;
  },
): Promise<string> {
  // Marking the outline ephemeral lets the API reuse it across requests instead
  // of re-reading ~10k tokens every time — the difference between ~11s and ~5s.
  const systemFor = (withOutline: boolean): Anthropic.Beta.BetaTextBlockParam[] | string =>
    withOutline && ctx.outline
      ? [
          { type: 'text', text: persona.system },
          {
            type: 'text',
            text: outlineBlock(ctx.outline),
            cache_control: { type: 'ephemeral' },
          },
        ]
      : persona.system;

  const buildParams = (
    messages: Anthropic.Beta.BetaMessageParam[],
    withMcp: boolean,
    withOutline: boolean,
  ): Anthropic.Beta.MessageCreateParamsStreaming => ({
    model: MODEL,
    max_tokens: 1024,
    system: systemFor(withOutline),
    messages,
    stream: true,
    betas: ['mcp-client-2025-11-20'],
    ...(withMcp
      ? {
          mcp_servers: [
            {
              type: 'url' as const,
              url: ctx.mcpUrl!,
              name: 'knowledge-base',
              authorization_token: ctx.mcpToken!,
            },
          ],
          tools: [{ type: 'mcp_toolset' as const, mcp_server_name: 'knowledge-base' }],
        }
      : {}),
  });

  const run = async (withMcp: boolean, withOutline: boolean): Promise<string> => {
    let messages = toApiMessages(transcript, persona.id);
    let full = '';
    for (let i = 0; i <= MAX_PAUSE_CONTINUATIONS; i++) {
      const stream = client.beta.messages.stream(buildParams(messages, withMcp, withOutline));
      for await (const event of stream) {
        // The model often narrates before it searches ("I'll look that up…").
        // A text block is only the real answer if no further tool call follows
        // it, so each time a search starts we discard the text collected so far
        // — otherwise the narration reaches the visitor and, worse, gets stored
        // as this persona's reply and replayed as context on later turns.
        if (event.type === 'content_block_start' && event.content_block.type === 'mcp_tool_use') {
          full = '';
          ctx.send({ type: 'searching', speaker: persona.id });
        }
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text;
          ctx.send({ type: 'delta', speaker: persona.id, text: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason !== 'pause_turn') break;
      // Server-side MCP work paused mid-turn: append the partial assistant
      // turn and re-send so the API resumes where it left off.
      messages = [...messages, { role: 'assistant', content: final.content }];
    }
    return full;
  };

  if (!ctx.mcpAvailable) {
    // Only reachable with KB_OPTIONAL=true (local development).
    return run(false, false);
  }
  try {
    const reply = await run(true, true);
    if (reply.trim() || !ctx.outline) return reply;
    // The model occasionally answers a preloaded outline with a malformed tool
    // call, which cannot execute and leaves no text at all. Better a slower
    // reply than none: fall back to the unaided path, where it fetches the
    // outline itself. `searching` clears whatever the client is showing.
    console.warn(`Empty reply for ${persona.id} with preloaded outline; retrying without it.`);
    ctx.send({ type: 'searching', speaker: persona.id });
    return await run(true, false);
  } catch (err) {
    if (!ctx.kbOptional) throw err; // production: fail closed
    console.warn(`MCP-backed reply failed for ${persona.id}; KB_OPTIONAL fallback:`, err);
    ctx.send({
      type: 'notice',
      message: 'Dev mode: knowledge base unreachable — answering from general knowledge.',
    });
    return run(false);
  }
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
