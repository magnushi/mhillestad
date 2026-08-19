// Receives the contact form and writes one document to the private `inbox`
// dataset. Server-only, because it holds a write token: anything the browser
// can see, anyone can use to write to the project.
//
// Submissions go to `inbox`, never to `production`. The content dataset is
// public-read, so a name and email written there would be published rather than
// stored.

import type { APIRoute } from 'astro';
import { API_VERSION, PROJECT_ID } from '../../lib/sanity';

export const prerender = false;

const INBOX_DATASET = 'inbox';

// Caps, so a single request cannot write a megabyte into the dataset.
const LIMITS = { name: 100, email: 200, message: 5000 };

// Bots submit the instant the DOM exists. A human cannot fill three fields in
// under a second, so anything faster is not a human.
const MIN_FILL_MS = 1000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function bad(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Read from process.env only, never import.meta.env: Vite inlines the latter
  // into the built bundle, which puts the literal token in a deployed file and
  // trips Netlify's secret scanning (it failed two deploys before this).
  // A runtime secret must stay a runtime lookup.
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    // Fail loudly rather than silently dropping someone's message.
    console.error('SANITY_WRITE_TOKEN is not set; cannot store contact messages.');
    return bad('The form is not configured. Please email instead.', 500);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return bad('Expected JSON.', 415);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad('Could not read that.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  const elapsed = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0;

  // A real visitor never sees the honeypot field, so anything in it is a bot.
  // Answer 200 so the bot records success and does not retry with variations.
  if (honeypot || elapsed < MIN_FILL_MS) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!name) return bad('Please give a name.');
  if (!EMAIL.test(email)) return bad('That email address does not look right.');
  if (!message) return bad('Please write a message.');
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    message.length > LIMITS.message
  ) {
    return bad('That is longer than the form accepts.');
  }

  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${INBOX_DATASET}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mutations: [
          {
            create: {
              _type: 'contactMessage',
              name,
              email,
              message,
              // Stamped here: a browser clock can be anything at all.
              submittedAt: new Date().toISOString(),
              handled: false,
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    // Log the reason for us, but never hand Sanity's error back to the visitor.
    console.error(`Sanity mutate failed (${res.status}): ${await res.text()}`);
    return bad('Could not send that just now. Please try again.', 502);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
