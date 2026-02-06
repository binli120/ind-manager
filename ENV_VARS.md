# Environment variables

| Name | Purpose | Default (dev) | Default (prod) |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ANALYSIS_API_URL` | Base URL for labeling/upload/analyze services (e.g. `/ncd/label-upload`, `/s3/upload-analyze`). | `http://localhost:8000` | `https://api.filynai.com` |
| `NEXT_PUBLIC_DOC_REPOSITORY_BUCKET` | S3 bucket for document storage. | `doc-repository-dev` | *(no default)* |
| `AWS_REGION` | AWS region for S3/API calls. | `us-east-1` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS creds for server-side S3 access (sections/asset APIs). | *(none)* | *(none)* |
| `AWS_SECRET_ACCESS_KEY` | AWS creds for server-side S3 access. | *(none)* | *(none)* |
| `DOC_REPOSITORY_BUCKET` | Server-side fallback bucket for sections/asset APIs. | `doc-repository-dev` | *(no default)* |

Notes:
- Client-side labeling/upload calls use `NEXT_PUBLIC_ANALYSIS_API_URL` when set; otherwise they fall back to the defaults above based on `NODE_ENV`.
- If you set `NEXT_PUBLIC_ANALYSIS_API_URL`, include the scheme (http/https) and no trailing slash.
- Bucket defaults can be overridden per-request in server routes, but these envs set the baseline.***
