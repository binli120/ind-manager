// Author: Bin Lee
// Email: binlee120@gmail.com

const LOCAL_PDF_ANALYSIS_API_BASE_URL = "http://localhost:8000";

export interface ResolvePdfAnalysisApiBaseUrlOptions {
  stripApiSuffix?: boolean;
  includeLocalDefault?: boolean;
}

const normalizeBaseUrl = (value: string, stripApiSuffix?: boolean) => {
  let normalized = value.trim().replace(/\/+$/, "");
  if (stripApiSuffix) {
    normalized = normalized.replace(/\/api\/?$/i, "");
  }
  return normalized.replace(/\/+$/, "");
};

const getConfiguredBaseUrl = () =>
  process.env.PDF_ANALYSIS_API_BASE_URL ??
  process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL ??
  "";

export const resolvePdfAnalysisApiBaseUrl = (
  options: ResolvePdfAnalysisApiBaseUrlOptions = {},
) => {
  const { stripApiSuffix = false } = options;
  const includeLocalDefault =
    options.includeLocalDefault ?? process.env.NODE_ENV !== "production";

  const configuredBaseUrl = normalizeBaseUrl(
    getConfiguredBaseUrl(),
    stripApiSuffix,
  );
  if (configuredBaseUrl) return configuredBaseUrl;

  if (!includeLocalDefault) return "";
  return normalizeBaseUrl(LOCAL_PDF_ANALYSIS_API_BASE_URL, stripApiSuffix);
};
