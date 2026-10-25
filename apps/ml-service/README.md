# Python ML Data Cleaning Service

A FastAPI service for structured CSV and Excel data. It is designed to sit beside the existing Node/TypeScript backend and expose profiling, data-quality detection, conservative repairs, validation, and cleaning reports.

## Capabilities

- Dataset profiling and before/after comparisons.
- Missing-value and exact-duplicate detection.
- String whitespace and case/spacing variant flags.
- User-configured numeric/required-field validation rules.
- Isolation Forest anomaly detection (flags need human review).
- Numeric KNN imputation when feasible; simple imputation fallbacks for small datasets and categorical columns.
- Optional whitespace trimming and exact duplicate removal.
- Post-cleaning validation and machine-readable report.
- CSV and Excel uploads (including choosing an Excel sheet), plus cleaned CSV output.
- Preview-then-apply workflow: the user approves individual changes before they are applied.
- Original DataFrame is not modified by cleaning functions.

## Install

From `apps/ml-service` in your project, put the supplied `app/` folder, `tests/` folder, and `requirements.txt` in that directory. Use your existing virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Run

From `apps/ml-service`:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation. Health check: `GET /health`.

By default the service accepts browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`. To allow other origins, set `ML_ALLOWED_ORIGINS` to a comma-separated list before starting the server.

Unexpected server errors return a JSON `500` response with CORS headers, so the browser shows the error rather than a generic CORS failure. Details are written to the service log.

## Endpoints

- `GET /health`
- `POST /api/analyze` — JSON body: `{"records":[{"age":20,"name":"Ada"}],"rules":{"age":{"min":0,"max":120}},"contamination":0.05,"exclude_columns":[]}`
- `POST /api/clean` — JSON body is an array of row objects. Options are query parameters: `imputation_method=auto|knn|median|mean|mode|constant`, `remove_duplicates=false`, `trim_whitespace=true`, `contamination=0.05`, `rules_json={}`, `exclude_columns_json=[]`.
- `POST /api/clean/preview` — same body as `/api/clean` plus `preview_records` and `changes` in the response. Returns a `preview_token` (valid for 30 minutes).
- `POST /api/clean/apply` — JSON body `{"preview_token": "...", "accepted_change_ids": ["0-0", "outlier-9"]}`. Applies only the approved changes to the uploaded records. The token is consumed on success.
- `POST /api/datasets/analyze-upload` — multipart form with `file`; optional `rules_json`, `contamination`, `exclude_columns_json`, `sheet_name`.
- `POST /api/datasets/clean-upload` — multipart form with `file`; returns cleaned CSV text and report as JSON.
- `POST /api/datasets/clean-upload/csv` — multipart form with `file`; returns a downloadable CSV.

Upload endpoints accept the same options as the JSON endpoints. `sheet_name` selects an Excel sheet (the first sheet is used by default).

The upload limit is 25 MB. Supported file types are `.csv`, `.xlsx`, and `.xls`.

### Input normalization

Every entry point (JSON records and uploads) normalizes data the same way:

- Placeholder text such as `ERROR`, `N/A`, `unknown`, `missing`, `null`, and `?` is treated as missing.
- A text column becomes numeric only when every non-missing value parses as a number. Identifier columns (`id`, `*_id`, `zip`, `postal_code`, `phone`, and similar) and date/time columns are never converted.
- Duplicate column names are rejected rather than silently renamed. Column names are trimmed.

## Validation rules

Send JSON such as `{"age":{"min":0,"max":120},"rating":{"min":1,"max":5},"email":{"required":true}}`. The current built-in range validation applies to numeric-convertible values. Domain-specific rules should be supplied by the caller; the service cannot infer every column's meaning safely.

## Tests

From `apps/ml-service`:

```powershell
python -m pytest -q
```

The suite is split by area:

- `tests/test_io_utils.py` — input normalization, file parsing, JSON-safe conversion.
- `tests/test_repair.py` — whitespace trimming, every imputation method, duplicates, and review items.
- `tests/test_detection.py` — missing values, invalid values, string variants, and outlier detection.
- `tests/test_api.py` — endpoint contracts, the preview/apply flow, validation errors, and CORS on server errors.
- `tests/test_datasets.py` — end-to-end runs on the sample files in `data/` (CSV and Excel). It checks that clean input comes back unchanged, that placeholder tokens are repaired, and that approving every change reproduces the preview.

## Important limits

- An outlier is not necessarily an error; Isolation Forest results are flagged for review.
- `Class` or other label/identifier columns should be passed in `exclude_columns` when they must not influence anomaly detection.
- KNN imputation is only applied to numeric columns and requires observed values; categorical columns use their most frequent value in `auto` mode. Median and mean are not applied to text, which falls back to the most frequent value.
- Count-like numeric columns (whole numbers only) stay whole numbers after imputation.
- Each repair operation lists at most 100 changes per column for review. `preview_records` shows the complete result, so for datasets with more than 100 repairs in one column the review list is a sample, not the full set.
- A column that is entirely missing is deliberately left missing rather than inventing values.
- Preview tokens are held in memory for 30 minutes and are lost if the service restarts. Run one service process if previews must be shared across requests.
- This service processes uploads in memory and does not persist datasets. The Node backend should manage ownership, database records, durable storage, authentication, and orchestration.
- The output is intended for tabular structured data, not images/audio/video.
