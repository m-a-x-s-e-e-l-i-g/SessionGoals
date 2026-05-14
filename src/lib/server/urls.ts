import { env as publicEnv } from '$env/dynamic/public';

export function getCanonicalOrigin(requestUrl: URL): string {
  const configuredUrl = publicEnv.PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      // Fall back to the request origin when the configured value is malformed.
    }
  }

  return requestUrl.origin;
}