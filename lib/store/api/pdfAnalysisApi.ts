// Author: Bin Lee
// Email: binlee120@gmail.com
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

const INVALID_JSON_ESCAPE_REGEX = /\\(?!["\\/bfnrtu])/g;
const CONCATENATED_JSON_OBJECTS_REGEX = /}\s*{/;
const CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX = /}\s*{/g;

const tryParseJson = (text: string): unknown | undefined => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const repairInvalidJsonEscapes = (text: string) =>
  text.replace(INVALID_JSON_ESCAPE_REGEX, "\\\\");

const parseLooseJsonPayload = (text: string): unknown => {
  const direct = tryParseJson(text);
  if (direct !== undefined) return direct;

  const repairedEscapes = repairInvalidJsonEscapes(text);
  const repairedParsed = tryParseJson(repairedEscapes);
  if (repairedParsed !== undefined) return repairedParsed;

  if (!CONCATENATED_JSON_OBJECTS_REGEX.test(repairedEscapes)) {
    return text;
  }

  const splitChunks = repairedEscapes.split(CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX);
  const parsedChunks = splitChunks
    .map((chunk, index) => {
      if (index === 0) return tryParseJson(`${chunk}}`);
      if (index === splitChunks.length - 1) return tryParseJson(`{${chunk}`);
      return tryParseJson(`{${chunk}}`);
    })
    .filter((value): value is unknown => value !== undefined);

  if (parsedChunks.length) {
    return parsedChunks[parsedChunks.length - 1];
  }

  const arrayCandidate = `[${repairedEscapes.replace(CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX, "},{")}]`;
  const parsedArray = tryParseJson(arrayCandidate);
  if (Array.isArray(parsedArray) && parsedArray.length) {
    return parsedArray[parsedArray.length - 1];
  }

  return text;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isBlankCell = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim().length === 0);

const isSparseTabulatedRow = (row: Record<string, unknown>, columns: string[]) => {
  const keys = columns.length ? columns : Object.keys(row);
  if (!keys.length) return true;

  const emptyCount = keys.reduce(
    (count, key) => count + (isBlankCell(row[key]) ? 1 : 0),
    0,
  );
  return emptyCount === keys.length || emptyCount / keys.length >= 0.7;
};

const inferMethodOfAdministration = (row: Record<string, unknown>) => {
  const location = String(row["Location in CTD"] ?? "");
  const context = location.toLowerCase();
  if (context.includes("in vitro")) return "in vitro";
  if (context.includes("intravenous") || context.includes(" i.v")) return "intravenous";
  if (context.includes("intraperitoneal") || context.includes(" i.p")) return "intraperitoneal";
  if (context.includes("oral") || context.includes(" p.o")) return "oral";
  return null;
};

const fillMissingTabulatedCells = (
  row: Record<string, unknown>,
  columns: string[],
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = { ...row };
  const keys = columns.length ? columns : Object.keys(row);
  keys.forEach((key) => {
    const value = normalized[key];
    if (!isBlankCell(value)) return;

    if (key === "Method of Administration") {
      const inferred = inferMethodOfAdministration(row);
      normalized[key] = inferred ?? "Not reported";
      return;
    }

    normalized[key] = "Not reported";
  });
  return normalized;
};

const pruneSparseTabulatedRows = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload;
  if (!Array.isArray(payload.tables)) return payload;

  const tables = payload.tables.map((table) => {
    if (!isRecord(table) || !Array.isArray(table.rows)) return table;

    const columns = Array.isArray(table.columns)
      ? table.columns.filter((column): column is string => typeof column === "string")
      : [];
    const rows = table.rows
      .filter((row) => {
        if (!isRecord(row)) return false;
        return !isSparseTabulatedRow(row, columns);
      })
      .map((row) => fillMissingTabulatedCells(row as Record<string, unknown>, columns));
    return { ...table, rows };
  });

  return { ...payload, tables };
};

const parseResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  return parseLooseJsonPayload(text);
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

  let payload = await parseResponsePayload(response);
  if (path.includes("/ncd/assets/tabulated")) {
    payload = pruneSparseTabulatedRows(payload);
  }

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
