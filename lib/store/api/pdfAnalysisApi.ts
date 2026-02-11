// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createAsyncThunk } from "@reduxjs/toolkit";
import { resolvePdfAnalysisApiBaseUrl } from "@/lib/common/pdfAnalysisApiBaseUrl";

export type PdfAnalysisApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type PdfAnalysisApiQuery = Record<string, PdfAnalysisApiQueryValue>;

export interface PdfAnalysisApiRequestOptions<
  TBody extends object | undefined = undefined,
  TQuery extends object | undefined = undefined,
> {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: TQuery;
  body?: BodyInit | TBody | null;
  headers?: HeadersInit;
  userIdHeader?: string | null;
  suppressErrorLog?: boolean;
  allowRedirects?: boolean;
}

export class PdfAnalysisApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "PdfAnalysisApiError";
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE_URL = resolvePdfAnalysisApiBaseUrl({ includeLocalDefault: false });

const DEBUG_API = process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_DEBUG === "true";

const buildApiUrl = (path: string, query?: object) => {
  // Prefer the explicit public API base when provided (both client + server).
  const baseUrl = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  if (!query) return baseUrl;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null) return;
        params.append(key, String(item));
      });
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

const parseResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractErrorMessage = (payload: unknown) => {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return null;

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === "string") return maybeMessage;

  const maybeDetail = (payload as { detail?: unknown }).detail;
  if (typeof maybeDetail === "string") return maybeDetail;

  if (Array.isArray(maybeDetail)) {
    const detailMessages = maybeDetail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value));

    if (detailMessages.length) return detailMessages.join(" ");
  }

  return null;
};

const isFormData = (value: unknown): value is FormData => {
  if (typeof FormData === "undefined") return false;
  return value instanceof FormData;
};

const isBlob = (value: unknown): value is Blob => {
  if (typeof Blob === "undefined") return false;
  return value instanceof Blob;
};

const isUrlSearchParams = (value: unknown): value is URLSearchParams => {
  if (typeof URLSearchParams === "undefined") return false;
  return value instanceof URLSearchParams;
};

const isArrayBuffer = (value: unknown): value is ArrayBuffer => {
  if (typeof ArrayBuffer === "undefined") return false;
  return value instanceof ArrayBuffer;
};

const isReadableStream = (value: unknown): value is ReadableStream => {
  if (typeof ReadableStream === "undefined") return false;
  return value instanceof ReadableStream;
};

const isBodyInit = (value: unknown): value is BodyInit =>
  typeof value === "string" ||
  isFormData(value) ||
  isBlob(value) ||
  isUrlSearchParams(value) ||
  isArrayBuffer(value) ||
  isReadableStream(value);

export const buildFormData = <T extends object>(payload: T) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (isBlob(value)) {
      formData.append(key, value);
      continue;
    }
    formData.append(key, String(value));
  }
  return formData;
};

export const requestPdfAnalysisApi = async <
  TResponse,
  TBody extends object | undefined = undefined,
  TQuery extends object | undefined = undefined,
>(
  options: PdfAnalysisApiRequestOptions<TBody, TQuery>,
): Promise<TResponse> => {
  const {
    path,
    method = "GET",
    query,
    body,
    headers,
    userIdHeader,
    suppressErrorLog,
    allowRedirects = false,
  } = options;
  const url = buildApiUrl(path, query);
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  if (userIdHeader) {
    requestHeaders["user-id"] = userIdHeader;
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isBodyInit(body)) {
      requestBody = body;
    } else {
      requestHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  if (DEBUG_API) {
    console.info("[pdf-analysis-api] Request", {
      method,
      url,
      query,
      headers: requestHeaders,
    });
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    redirect: allowRedirects ? "follow" : "manual",
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (!allowRedirects && response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const message =
        location
          ? `Request redirected to ${location} (possible auth redirect or wrong API base URL)`
          : "Request was redirected (possible auth redirect or wrong API base URL)";
      if (!suppressErrorLog) {
        console.error("[pdf-analysis-api] Redirect blocked", {
          method,
          url,
          status: response.status,
          location,
        });
      }
      throw new PdfAnalysisApiError(message, response.status, payload);
    }
    const message =
      extractErrorMessage(payload) || response.statusText || "Request failed";
    if (!suppressErrorLog) {
      console.error("[pdf-analysis-api] Request failed", {
        method,
        url,
        status: response.status,
        message,
        payload,
      });
    }
    throw new PdfAnalysisApiError(message, response.status, payload);
  }

  if (DEBUG_API) {
    console.info("[pdf-analysis-api] Response", {
      method,
      url,
      status: response.status,
    });
  }

  return payload as TResponse;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof PdfAnalysisApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};

export const createPdfAnalysisThunk = <Response, Args>(
  typePrefix: string,
  request: (args: Args) => Promise<Response>,
) =>
  createAsyncThunk<Response, Args, { rejectValue: string }>(
    `pdfAnalysisApi/${typePrefix}`,
    async (args, { rejectWithValue }) => {
      try {
        return await request(args);
      } catch (error) {
        console.error("[pdf-analysis-api] Thunk error", {
          typePrefix,
          error,
        });
        return rejectWithValue(getErrorMessage(error));
      }
    },
  );
