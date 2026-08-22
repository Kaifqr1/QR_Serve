export function getOAuthConfigurationError(oauthPortalUrl?: string, appId?: string): string | null {
  if (!oauthPortalUrl) return "VITE_OAUTH_PORTAL_URL is missing from the production build.";
  if (!appId) return "VITE_APP_ID is missing from the production build.";
  return null;
}
