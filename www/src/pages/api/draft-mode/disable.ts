import type { APIRoute } from 'astro';
import { perspectiveCookieName } from '../../../lib/preview';

export const prerender = false;

// Presentation never calls this itself; it exists so an editor can leave draft
// mode by visiting it.
export const GET: APIRoute = () =>
  new Response(null, {
    status: 307,
    headers: new Headers({
      Location: '/',
      'Set-Cookie': `${perspectiveCookieName}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
    }),
  });
