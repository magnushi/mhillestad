// The Sanity context MCP exposes two tools: `initial_context`, which returns a
// ~10k-token outline of the whole knowledge base, and `knowledge_base_read`,
// which fetches entries by path. Left to itself the model calls them in
// sequence, so every visitor message pays two round trips and re-sends the
// outline as fresh input — roughly 11s per reply, of which ~80% is that dance.
//
// The outline is static between knowledge-base edits, so we fetch it once per
// server instance and hand it to the model up front as a cached system block.
// The model can then go straight to `knowledge_base_read`, or answer directly
// when the outline already covers the question.

const OUTLINE_TTL_MS = 60 * 60 * 1000; // refresh hourly so KB edits land

let cache: { text: string; at: number } | null = null;
let inFlight: Promise<string | null> | null = null;

/** Pull the JSON-RPC payload out of a response that may be JSON or SSE. */
function parsePayload(body: string): unknown {
  const line = body.split('\n').find((l) => l.startsWith('data: '));
  try {
    return JSON.parse(line ? line.slice(6) : body);
  } catch {
    return null;
  }
}

async function fetchOutline(url: string, token: string): Promise<string | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };

  const init = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'canal-mania', version: '1' },
      },
    }),
  });
  if (!init.ok) throw new Error(`MCP initialize failed (${init.status})`);

  const sessionId = init.headers.get('mcp-session-id');
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'initial_context', arguments: {} },
    }),
  });
  if (!res.ok) throw new Error(`MCP initial_context failed (${res.status})`);

  const payload = parsePayload(await res.text()) as
    | { result?: { content?: { text?: string }[] } }
    | null;
  const text = payload?.result?.content?.[0]?.text;
  return typeof text === 'string' && text.length > 0 ? text : null;
}

/**
 * The knowledge-base outline, cached per server instance. Returns null if it
 * cannot be fetched — callers should then fall back to letting the model call
 * `initial_context` itself, which is slower but still correct.
 */
export async function getOutline(url: string, token: string): Promise<string | null> {
  if (cache && Date.now() - cache.at < OUTLINE_TTL_MS) return cache.text;
  if (inFlight) return inFlight; // concurrent cold starts share one fetch

  inFlight = (async () => {
    try {
      const text = await fetchOutline(url, token);
      if (text) cache = { text, at: Date.now() };
      return text;
    } catch (err) {
      console.warn('Could not preload knowledge-base outline; falling back:', err);
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Run a knowledge-base tool ourselves.
 *
 * Normally the Anthropic MCP connector executes these server-side. But when the
 * model emits arguments that do not match the tool's schema — most often
 * `paths` as a JSON-encoded string rather than an array — the connector cannot
 * run the call, and it arrives as an ordinary client-side `tool_use` instead.
 * Executing it here (after repairing the arguments) turns a dead turn into a
 * real answer.
 */
export async function callTool(
  url: string,
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };

  const init = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'canal-mania', version: '1' },
      },
    }),
  });
  const sessionId = init.headers.get('mcp-session-id');
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name, arguments: repairArgs(args) },
    }),
  });
  const payload = parsePayload(await res.text()) as
    | { result?: { content?: { text?: string }[] }; error?: { message?: string } }
    | null;

  if (payload?.error) throw new Error(payload.error.message ?? 'knowledge base call failed');
  return (payload?.result?.content ?? [])
    .map((c) => c.text ?? '')
    .join('\n')
    .trim();
}

/** Coerce array-typed arguments the model sent as strings back into arrays. */
function repairArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...args };
  for (const key of ['paths']) {
    const v = out[key];
    if (typeof v !== 'string') continue;
    try {
      const parsed = JSON.parse(v);
      out[key] = Array.isArray(parsed) ? parsed : [v];
    } catch {
      out[key] = [v];
    }
  }
  return out;
}

/**
 * System-prompt block wrapping the outline.
 *
 * Keep this wording minimal. Describing the read tool's arguments in prose —
 * even correctly — makes the model emit `paths` as a JSON-encoded string
 * instead of an array. The malformed call cannot execute server-side, comes
 * back as a client-side `tool_use` we do not answer, and the visitor gets an
 * empty reply. Saying nothing about arguments leaves the tool's own schema to
 * speak for itself, which works.
 */
export function outlineBlock(outline: string): string {
  return `Knowledge base outline below — do NOT call initial_context.

${outline}`;
}
