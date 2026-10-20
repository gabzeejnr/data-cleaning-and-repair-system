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
- CSV and Excel uploads, plus cleaned CSV output.
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

## Endpoints

- `GET /health`
- `POST /api/analyze` — JSON body: `{"records":[{"age":20,"name":"Ada"}],"rules":{"age":{"min":0,"max":120}},"contamination":0.05,"exclude_columns":[]}`
- `POST /api/clean` — JSON body is an array of row objects. Options are query parameters: `imputation_method=auto|knn|median|mean|mode|constant`, `remove_duplicates=false`, `trim_whitespace=true`, `contamination=0.05`, `rules_json={}`, `exclude_columns_json=[]`.
- `POST /api/datasets/analyze-upload` — multipart form with `file`; optional `rules_json`, `contamination`, `exclude_columns_json`.
- `POST /api/datasets/clean-upload` — multipart form with `file`; returns cleaned CSV text and report as JSON.
- `POST /api/datasets/clean-upload/csv` — multipart form with `file`; returns a downloadable CSV.

The upload limit is 25 MB. Supported file types are `.csv`, `.xlsx`, and `.xls` (Excel reading requires an installed compatible engine; `openpyxl` covers `.xlsx`).

## Validation rules

Send JSON such as `{"age":{"min":0,"max":120},"rating":{"min":1,"max":5},"email":{"required":true}}`. The current built-in range validation applies to numeric-convertible values. Domain-specific rules should be supplied by the caller; the service cannot infer every column's meaning safely.

## Tests

```powershell
python -m pytest -q
```

## Important limits

- An outlier is not necessarily an error; Isolation Forest results are flagged for review.
- `Class` or other label/identifier columns should be passed in `exclude_columns` when they must not influence anomaly detection.
- KNN imputation is only applied to numeric columns and requires observed values; categorical columns use their most frequent value in `auto` mode.
- A column that is entirely missing is deliberately left missing rather than inventing values.
- This service processes uploads in memory and does not persist datasets. The Node backend should manage ownership, database records, durable storage, authentication, and orchestration.
- The output is intended for tabular structured data, not images/audio/video.
