# Environment variables

| Name | Purpose | Default (dev) | Default (prod) |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL` | Base URL for PDF analysis APIs (e.g. `/ncd/*`, `/s3/upload-analyze`). Use your ALB URL in dev/staging. | `http://localhost:8000` | *(no default; must be configured)* |
| `PDF_ANALYSIS_API_BASE_URL` | Server-only override for PDF analysis API base URL. | `http://localhost:8000` | *(no default; optional override)* |
| `NEXT_PUBLIC_DOC_REPOSITORY_BUCKET` | S3 bucket for document storage. | `doc-repository-dev` | *(no default)* |
| `AWS_REGION` | AWS region for S3/API calls. | `us-east-1` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS creds for server-side S3 access (sections/asset APIs). | *(none)* | *(none)* |
| `AWS_SECRET_ACCESS_KEY` | AWS creds for server-side S3 access. | *(none)* | *(none)* |
| `DOC_REPOSITORY_BUCKET` | Server-side fallback bucket for sections/asset APIs. | `doc-repository-dev` | *(no default)* |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key required for cross-user notification fan-out (system/project/user dispatch APIs). | *(none)* | *(required for notifications)* |
| `RESEND_API_KEY` | Optional API key for email notification delivery. If omitted, notifications are still delivered in-app. | *(none)* | *(optional)* |
| `NOTIFICATION_EMAIL_FROM` | Sender identity used for email notifications (e.g. `IND Manager <notify@company.com>`). | *(none)* | *(required for email delivery)* |

Notes:
- Preferred variable is `NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL`.
- `NEXT_PUBLIC_ANALYSIS_API_URL` is still accepted as a legacy fallback.
- Include scheme (http/https) and no trailing slash for base URLs.
- Bucket defaults can be overridden per-request in server routes, but these envs set the baseline.
