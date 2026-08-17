import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { withoutSecretSearchParams } from '@sanity/preview-url-secret/without-secret-search-params';
import { API_VERSION, DATASET, PROJECT_ID } from '../../../lib/sanity';
import { perspectiveCookieName, readToken } from '../../../lib/preview';

export const prerender = false;

// Presentation opens the preview by navigating the iframe here with a signed
// secret. We validate that secret against the Sanity API before setting the
// cookie — without this step the preview route would hand unpublished content
// to anyone who found the URL.
export const GET: APIRoute = async ({ request }) => {
  const token = readToken();
  if (!token) {
    return new Response('Preview is not configured (missing SANITY_API_READ_TOKEN).', {
      status: 503,
    });
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION.replace(/^v/, ''),
    useCdn: false,
    token,
  });

  const { isValid, redirectTo, studioPreviewPerspective } = await validatePreviewUrl(
    client,
    request.url,
  );
  if (!isValid) {
    return new Response('Invalid preview secret', { status: 401 });
  }

  const target = redirectTo
    ? withoutSecretSearchParams(new URL(redirectTo, request.url)).pathname
    : '/';
  const perspective = studioPreviewPerspective || 'drafts';

  const headers = new Headers({ Location: `/preview${target === '/' ? '' : target}` });
  // SameSite=None because the preview is rendered inside the Studio's iframe.
  headers.append(
    'Set-Cookie',
    `${perspectiveCookieName}=${perspective}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`,
  );
  return new Response(null, { status: 307, headers });
};
