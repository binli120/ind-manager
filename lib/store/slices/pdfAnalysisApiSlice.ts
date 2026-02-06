// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import {
  buildFormData,
  createPdfAnalysisThunk,
  requestPdfAnalysisApi,
} from "@/lib/store/api/pdfAnalysisApi";
import {
  type ActionReducerMapBuilder,
  type AsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export type PdfAnalysisResponse = Record<string, unknown>;
export type PdfAnalysisHealthResponse = Record<string, string>;

export interface AnalyzePdfRequest {
  body?: Record<string, unknown> | FormData;
}

export interface UploadAndAnalyzeToS3Request {
  file: File;
  bucket: string;
  company: string;
  project: string;
  folder?: string;
  aws_region?: string | null;
  wait_for_completion?: boolean;
  wait_timeout_seconds?: number;
  engine?: string;
  max_pages?: number | null;
  ocr_fallback?: boolean;
  table_rows?: number | null;
}

export interface S3MarkdownRequest {
  bucket: string;
  key: string;
  version_id?: string | null;
  aws_region?: string | null;
}

export interface S3MarkdownUploadRequest {
  bucket: string;
  path: string;
  filename: string;
  markdown: string;
  label?: string | null;
  tags?: Record<string, string> | null;
  metadata?: Record<string, string> | null;
  aws_region?: string | null;
}

export interface S3AnalysisQuery {
  bucket: string;
  key: string;
  aws_region?: string | null;
}

export interface NCDLabelRequest {
  key: string;
  company: string;
  project: string;
  bucket?: string | null;
  aws_region?: string | null;
  page_limit?: number;
  use_llm?: boolean;
}

export interface NCDRelabelRequest {
  key: string;
  company: string;
  project: string;
  section_number: string;
  section_title?: string | null;
  bucket?: string | null;
  aws_region?: string | null;
}

export interface TemplateOverrideRequest {
  user_id: string;
  section: string;
  subsection?: string | null;
  payload: Record<string, unknown>;
  aws_region?: string | null;
}

export interface NCDTemplateQuery {
  section?: string | null;
  userId?: string | null;
}

export interface NCDTemplatesQuery {
  userId: string;
  bucket?: string | null;
  prefixes?: string | null;
  expires_in?: number;
  aws_region?: string | null;
}

export interface NCDTemplateDocxQuery {
  section: string;
  bucket?: string | null;
  expires_in?: number;
  aws_region?: string | null;
}

export interface NCDCtdElementQuery {
  element: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  refresh?: boolean;
}

export interface NCDCtdSectionQuery {
  section: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  include_tables?: boolean;
  include_images?: boolean;
}

export interface NCDAssetsQuery {
  section: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  limit?: number;
}

export interface NCDAssetsContentsQuery {
  section: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  content_type?: string | null;
  include_assets?: boolean;
}

export interface CTDSectionSummaryRequest {
  section: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  user_prompt?: string | null;
  user_comment?: string | null;
  previous_summary_id?: string | null;
  refresh_template?: boolean;
}

export interface CTDSectionSummaryApproveRequest {
  tenant_id: string;
  project_id: string;
  bucket: string;
  final_text: string;
  summary_id?: string | null;
  section?: string | null;
}

export interface CTDTabulatedSummaryRequest {
  section: string;
  tenant_id: string;
  project_id: string;
  bucket: string;
  use_llm?: boolean | null;
  user_prompt?: string | null;
  user_comment?: string | null;
  previous_tabulated_id?: string | null;
  refresh_template?: boolean;
}

export interface CTDTabulatedSummaryApproveRequest {
  tenant_id: string;
  project_id: string;
  bucket: string;
  final_payload: Record<string, unknown>;
  summary_id?: string | null;
  section?: string | null;
}

export interface DevLabelLocalRequest {
  file: File;
  page_limit?: number;
  use_llm?: boolean;
}

export interface DevSectionsQuery {
  limit?: number;
}

export const fetchHealth = createPdfAnalysisThunk<
  PdfAnalysisHealthResponse,
  void
>(
  "health",
  async () =>
    requestPdfAnalysisApi({
      path: "/health",
      method: "GET",
    }),
);

export const analyzePdf = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  AnalyzePdfRequest | void
>("analyze", async (request) =>
  requestPdfAnalysisApi({
    path: "/analyze",
    method: "POST",
    body: request?.body,
  }));

export const fetchDevSections = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  DevSectionsQuery | void
>("devSections", async (query) =>
  requestPdfAnalysisApi({
    path: "/dev/sections",
    method: "GET",
    query: query ?? undefined,
  }));

export const fetchTemplateSections = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDTemplateQuery | void
>("ncdTemplate", async (query) =>
  requestPdfAnalysisApi({
    path: "/ncd/template",
    method: "GET",
    query: query ?? undefined,
    userIdHeader: query?.userId ?? null,
  }));

export const fetchS3AnalysisStatus = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  S3AnalysisQuery
>(
  "s3AnalysisStatus",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/s3/analysis/status",
      method: "GET",
      query,
    }),
);

export const fetchS3AnalysisResult = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  S3AnalysisQuery
>(
  "s3AnalysisResult",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/s3/analysis/result",
      method: "GET",
      query,
    }),
);

export const fetchTemplateDownloads = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDTemplatesQuery
>("ncdTemplates", async (query) =>
  requestPdfAnalysisApi({
    path: "/ncd/templates",
    method: "GET",
    query,
    userIdHeader: query.userId,
  }));

export const fetchTemplateDocx = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDTemplateDocxQuery
>(
  "ncdTemplateDocx",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/ncd/template/docx",
      method: "GET",
      query,
    }),
);

export const fetchCtdElementReference = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDCtdElementQuery
>("ncdCtdElement", async (query) =>
  requestPdfAnalysisApi({
    path: "/ncd/ctd/2.4/element",
    method: "GET",
    query,
  }));

export const fetchCtdSectionMaterials = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDCtdSectionQuery
>("ncdCtdSection", async (query) =>
  requestPdfAnalysisApi({
    path: "/ncd/ctd/2.6/section",
    method: "GET",
    query,
  }));

export const fetchAssetsImages = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDAssetsQuery
>(
  "ncdAssetsImage",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/image",
      method: "GET",
      query,
    }),
);

export const fetchAssetsTables = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDAssetsQuery
>(
  "ncdAssetsTable",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/table",
      method: "GET",
      query,
    }),
);

export const fetchAssetsContents = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDAssetsContentsQuery
>(
  "ncdAssetsContents",
  async (query) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/contents",
      method: "GET",
      query,
    }),
);

export const fetchS3Markdown = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  S3MarkdownRequest
>("s3Markdown", async (request) =>
  requestPdfAnalysisApi({
    path: "/s3/markdown",
    method: "POST",
    body: request,
  }));

export const fetchS3MarkdownSummary = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  S3MarkdownRequest
>(
  "s3MarkdownSummary",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/s3/markdown/summary",
      method: "POST",
      body: request,
    }),
);

export const saveS3Markdown = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  S3MarkdownUploadRequest
>(
  "s3MarkdownSave",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/s3/markdown/save",
      method: "POST",
      body: request,
    }),
);

export const labelS3Pdf = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDLabelRequest
>(
  "ncdLabel",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/label",
      method: "POST",
      body: request,
    }),
);

export const relabelS3Pdf = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  NCDRelabelRequest
>(
  "ncdRelabel",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/relabel",
      method: "POST",
      body: request,
    }),
);

export const upsertTemplateOverride = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  TemplateOverrideRequest
>(
  "ncdTemplateOverride",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/template/override",
      method: "POST",
      body: request,
    }),
);

export const createCtdSectionSummary = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  CTDSectionSummaryRequest
>(
  "ncdAssetsSummary",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/summary",
      method: "POST",
      body: request,
    }),
);

export const approveCtdSectionSummary = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  CTDSectionSummaryApproveRequest
>(
  "ncdAssetsSummaryApprove",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/summary/approve",
      method: "POST",
      body: request,
    }),
);

export const createCtdTabulatedSummary = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  CTDTabulatedSummaryRequest
>(
  "ncdAssetsTabulated",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/tabulated",
      method: "POST",
      body: request,
    }),
);

export const approveCtdTabulatedSummary = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  CTDTabulatedSummaryApproveRequest
>(
  "ncdAssetsTabulatedApprove",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/ncd/assets/tabulated/approve",
      method: "POST",
      body: request,
    }),
);

export const uploadAndAnalyzeToS3 = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  UploadAndAnalyzeToS3Request
>(
  "s3UploadAnalyze",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/s3/upload-analyze",
      method: "POST",
      body: buildFormData(request),
    }),
);

export const devLabelLocal = createPdfAnalysisThunk<
  PdfAnalysisResponse,
  DevLabelLocalRequest
>(
  "devLabelLocal",
  async (request) =>
    requestPdfAnalysisApi({
      path: "/dev/label-local",
      method: "POST",
      body: buildFormData(request),
    }),
);

type ApiStatus = "idle" | "loading" | "succeeded" | "failed";

interface ApiRequestState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
}

const createRequestState = <T>(): ApiRequestState<T> => ({
  data: null,
  status: "idle",
  error: null,
});

export interface PdfAnalysisApiState {
  health: ApiRequestState<PdfAnalysisResponse>;
  analyze: ApiRequestState<PdfAnalysisResponse>;
  s3UploadAnalyze: ApiRequestState<PdfAnalysisResponse>;
  s3Markdown: ApiRequestState<PdfAnalysisResponse>;
  s3MarkdownSummary: ApiRequestState<PdfAnalysisResponse>;
  s3MarkdownSave: ApiRequestState<PdfAnalysisResponse>;
  s3AnalysisStatus: ApiRequestState<PdfAnalysisResponse>;
  s3AnalysisResult: ApiRequestState<PdfAnalysisResponse>;
  ncdLabel: ApiRequestState<PdfAnalysisResponse>;
  ncdRelabel: ApiRequestState<PdfAnalysisResponse>;
  ncdTemplateOverride: ApiRequestState<PdfAnalysisResponse>;
  ncdTemplate: ApiRequestState<PdfAnalysisResponse>;
  ncdTemplates: ApiRequestState<PdfAnalysisResponse>;
  ncdTemplateDocx: ApiRequestState<PdfAnalysisResponse>;
  ncdCtdElement: ApiRequestState<PdfAnalysisResponse>;
  ncdCtdSection: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsImage: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsTable: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsContents: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsSummary: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsSummaryApprove: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsTabulated: ApiRequestState<PdfAnalysisResponse>;
  ncdAssetsTabulatedApprove: ApiRequestState<PdfAnalysisResponse>;
  devLabelLocal: ApiRequestState<PdfAnalysisResponse>;
  devSections: ApiRequestState<PdfAnalysisResponse>;
}

export type PdfAnalysisApiKey = keyof PdfAnalysisApiState;

const initialState: PdfAnalysisApiState = {
  health: createRequestState<PdfAnalysisResponse>(),
  analyze: createRequestState<PdfAnalysisResponse>(),
  s3UploadAnalyze: createRequestState<PdfAnalysisResponse>(),
  s3Markdown: createRequestState<PdfAnalysisResponse>(),
  s3MarkdownSummary: createRequestState<PdfAnalysisResponse>(),
  s3MarkdownSave: createRequestState<PdfAnalysisResponse>(),
  s3AnalysisStatus: createRequestState<PdfAnalysisResponse>(),
  s3AnalysisResult: createRequestState<PdfAnalysisResponse>(),
  ncdLabel: createRequestState<PdfAnalysisResponse>(),
  ncdRelabel: createRequestState<PdfAnalysisResponse>(),
  ncdTemplateOverride: createRequestState<PdfAnalysisResponse>(),
  ncdTemplate: createRequestState<PdfAnalysisResponse>(),
  ncdTemplates: createRequestState<PdfAnalysisResponse>(),
  ncdTemplateDocx: createRequestState<PdfAnalysisResponse>(),
  ncdCtdElement: createRequestState<PdfAnalysisResponse>(),
  ncdCtdSection: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsImage: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsTable: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsContents: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsSummary: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsSummaryApprove: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsTabulated: createRequestState<PdfAnalysisResponse>(),
  ncdAssetsTabulatedApprove: createRequestState<PdfAnalysisResponse>(),
  devLabelLocal: createRequestState<PdfAnalysisResponse>(),
  devSections: createRequestState<PdfAnalysisResponse>(),
};

const applyThunkHandlers = <Returned, ThunkArg>(
  builder: ActionReducerMapBuilder<PdfAnalysisApiState>,
  key: PdfAnalysisApiKey,
  thunk: AsyncThunk<Returned, ThunkArg, { rejectValue: string }>,
) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[key].status = "loading";
      state[key].error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[key].status = "succeeded";
      state[key].data = action.payload as PdfAnalysisResponse;
      state[key].error = null;
    })
    .addCase(thunk.rejected, (state, action) => {
      state[key].status = "failed";
      state[key].error = (action.payload as string) || action.error.message ||
        "Request failed";
    });
};

const pdfAnalysisApiSlice = createSlice({
  name: "pdfAnalysisApi",
  initialState,
  reducers: {
    clearPdfAnalysisError(state, action: PayloadAction<PdfAnalysisApiKey>) {
      state[action.payload].error = null;
    },
    resetPdfAnalysisRequest(state, action: PayloadAction<PdfAnalysisApiKey>) {
      state[action.payload] = createRequestState<PdfAnalysisResponse>();
    },
  },
  extraReducers: (builder) => {
    applyThunkHandlers(builder, "health", fetchHealth);
    applyThunkHandlers(builder, "analyze", analyzePdf);
    applyThunkHandlers(builder, "s3UploadAnalyze", uploadAndAnalyzeToS3);
    applyThunkHandlers(builder, "s3Markdown", fetchS3Markdown);
    applyThunkHandlers(builder, "s3MarkdownSummary", fetchS3MarkdownSummary);
    applyThunkHandlers(builder, "s3MarkdownSave", saveS3Markdown);
    applyThunkHandlers(builder, "s3AnalysisStatus", fetchS3AnalysisStatus);
    applyThunkHandlers(builder, "s3AnalysisResult", fetchS3AnalysisResult);
    applyThunkHandlers(builder, "ncdLabel", labelS3Pdf);
    applyThunkHandlers(builder, "ncdRelabel", relabelS3Pdf);
    applyThunkHandlers(builder, "ncdTemplateOverride", upsertTemplateOverride);
    applyThunkHandlers(builder, "ncdTemplate", fetchTemplateSections);
    applyThunkHandlers(builder, "ncdTemplates", fetchTemplateDownloads);
    applyThunkHandlers(builder, "ncdTemplateDocx", fetchTemplateDocx);
    applyThunkHandlers(builder, "ncdCtdElement", fetchCtdElementReference);
    applyThunkHandlers(builder, "ncdCtdSection", fetchCtdSectionMaterials);
    applyThunkHandlers(builder, "ncdAssetsImage", fetchAssetsImages);
    applyThunkHandlers(builder, "ncdAssetsTable", fetchAssetsTables);
    applyThunkHandlers(builder, "ncdAssetsContents", fetchAssetsContents);
    applyThunkHandlers(builder, "ncdAssetsSummary", createCtdSectionSummary);
    applyThunkHandlers(
      builder,
      "ncdAssetsSummaryApprove",
      approveCtdSectionSummary,
    );
    applyThunkHandlers(
      builder,
      "ncdAssetsTabulated",
      createCtdTabulatedSummary,
    );
    applyThunkHandlers(
      builder,
      "ncdAssetsTabulatedApprove",
      approveCtdTabulatedSummary,
    );
    applyThunkHandlers(builder, "devLabelLocal", devLabelLocal);
    applyThunkHandlers(builder, "devSections", fetchDevSections);
  },
});

export const { clearPdfAnalysisError, resetPdfAnalysisRequest } =
  pdfAnalysisApiSlice.actions;

export default pdfAnalysisApiSlice.reducer;

export const selectPdfAnalysisRequest = (
  state: { pdfAnalysisApi: PdfAnalysisApiState },
  key: PdfAnalysisApiKey,
) => state.pdfAnalysisApi[key];

export const selectPdfAnalysisData = (
  state: { pdfAnalysisApi: PdfAnalysisApiState },
  key: PdfAnalysisApiKey,
) => state.pdfAnalysisApi[key].data;

export const selectPdfAnalysisStatus = (
  state: { pdfAnalysisApi: PdfAnalysisApiState },
  key: PdfAnalysisApiKey,
) => state.pdfAnalysisApi[key].status;

export const selectPdfAnalysisError = (
  state: { pdfAnalysisApi: PdfAnalysisApiState },
  key: PdfAnalysisApiKey,
) => state.pdfAnalysisApi[key].error;
