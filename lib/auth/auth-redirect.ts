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
  const parsedUrl = new URL(configuredBaseUrl, fallbackOrigin);
  const currentPath = trimTrailingSlashes(parsedUrl.pathname);

  if (!path) {
    return currentPath && currentPath !== "/"
      ? `${parsedUrl.origin}${currentPath}`
      : parsedUrl.origin;
  }
  const targetPath = trimTrailingSlashes(normalizePath(path));

  // If env is already a full route (e.g. .../auth/reset-password), do not append again.
  if (currentPath && currentPath !== "/" && currentPath.endsWith(targetPath)) {
    return `${parsedUrl.origin}${currentPath}`;
  }

  const nextPath = currentPath && currentPath !== "/"
    ? `${currentPath}${targetPath}`
    : targetPath;

  return `${parsedUrl.origin}${nextPath}`;
};
