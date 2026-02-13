// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const normalizePath = (value: string) =>
  value.startsWith("/") ? value : `/${value}`;

export const resolveAuthEmailRedirectUrl = (
  fallbackOrigin: string,
  path?: string,
) => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
    fallbackOrigin;
  const baseUrl = trimTrailingSlashes(configuredBaseUrl);

  if (!path) {
    return baseUrl;
  }

  return `${baseUrl}${normalizePath(path)}`;
};
