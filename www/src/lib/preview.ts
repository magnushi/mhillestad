// Draft preview plumbing.
//
// Draft content is not public, so previewing it needs a token, which means it
// has to stay server-side. The cookie set below is the only thing that switches
// a request onto draft content, and it is only ever set after Presentation's
// signed secret has been validated against the Sanity API — otherwise anyone
// who guessed the URL could read unpublished content.

import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';

export { perspectiveCookieName };

export function readToken(): string | undefined {
  return (
    (import.meta.env.SANITY_API_READ_TOKEN as string | undefined) ??
    process.env.SANITY_API_READ_TOKEN ??
    undefined
  );
}

/** True when the request carries a validated draft-mode cookie. */
export function isDraftMode(request: Request): boolean {
  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(/;\s*/).some((c) => c.startsWith(`${perspectiveCookieName}=`));
}
