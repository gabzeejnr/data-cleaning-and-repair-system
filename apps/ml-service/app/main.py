from __future__ import annotations

import json
import logging
import os
from contextlib import contextmanager
from copy import deepcopy
from threading import Lock
from time import monotonic, perf_counter
from typing import Any, Iterator, Literal
from uuid import uuid4

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from .detection import detect_quality_issues
from .io_utils import (
    MAX_UPLOAD_BYTES,
    dataframe_to_csv_bytes,
    read_dataset,
    records_to_dataframe,
    to_json_safe,
)
from .profiling import profile_dataset
from .repair import get_reviewable_changes, validate_dataset
from .reporting import run_cleaning_workflow

logger = logging.getLogger("ml_service")

DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ML_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if origin.strip()
]
PREVIEW_TTL_SECONDS = 1800
MAX_PREVIEWS = 200

ImputationMethod = Literal["auto", "knn", "median", "mean", "mode", "constant"]


app = FastAPI(
    title="Machine Learning Data Cleaning Service",
    description=(
        "Profiles structured datasets, detects quality issues, "
        "performs conservative repairs, and produces reports."
    ),
    version="1.0.0",
)


@app.middleware("http")
async def json_error_for_unexpected_failures(request: Request, call_next):
    """Turn unexpected crashes into a JSON 500.

    Registered before CORS so the CORS headers are still attached; otherwise the
    browser reports a CORS failure and hides the real error.
    """
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. See the ML service logs for details."},
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Request models
# --------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    exclude_columns: list[str] = Field(default_factory=list)


class CleanOptions(BaseModel):
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    exclude_columns: list[str] = Field(default_factory=list)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    imputation_method: ImputationMethod = "auto"
    remove_duplicates: bool = False
    trim_whitespace: bool = True


class CleanRequest(CleanOptions):
    records: list[dict[str, Any]] = Field(min_length=1)


class ApplyChangesRequest(BaseModel):
    preview_token: str
    accepted_change_ids: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------

@contextmanager
def client_errors() -> Iterator[None]:
    """Report bad input (validation, parsing, unsupported values) as HTTP 422."""
    try:
        yield
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def dataframe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert DataFrame records into JSON-safe Python values."""
    return to_json_safe(
        df.astype(object)
        .where(pd.notna(df), None)
        .to_dict(orient="records")
    )


def _parse_json(raw: str, expected: type, name: str) -> Any:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{name} must be valid JSON: {exc}") from exc

    if not isinstance(value, expected):
        kind = "object" if expected is dict else "array"
        raise ValueError(f"{name} must be a JSON {kind}.")
    return value


def options_from_form(
    imputation_method: str,
    remove_duplicates: bool,
    trim_whitespace: bool,
    contamination: float,
    rules_json: str,
    exclude_columns_json: str,
) -> CleanOptions:
    return CleanOptions(
        imputation_method=imputation_method,
        remove_duplicates=remove_duplicates,
        trim_whitespace=trim_whitespace,
        contamination=contamination,
        rules=_parse_json(rules_json, dict, "rules_json"),
        exclude_columns=_parse_json(exclude_columns_json, list, "exclude_columns_json"),
    )


def run_workflow(df: pd.DataFrame, options: CleanOptions) -> tuple[pd.DataFrame, dict[str, Any]]:
    return run_cleaning_workflow(
        df,
        rules=options.rules,
        contamination=options.contamination,
        exclude_columns=options.exclude_columns,
        imputation_method=options.imputation_method,
        remove_duplicates=options.remove_duplicates,
        trim_whitespace=options.trim_whitespace,
    )


async def read_upload(file: UploadFile, sheet_name: str | None = None) -> pd.DataFrame:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    return read_dataset(file.filename or "dataset.csv", content, sheet_name)


# --------------------------------------------------------------------------
# Preview store (approved changes are applied from here, never from the client)
# --------------------------------------------------------------------------

preview_cache: dict[str, dict[str, Any]] = {}
_preview_lock = Lock()


def _drop_expired_previews(now: float) -> None:
    expired = [token for token, entry in preview_cache.items() if now >= entry["expires_at"]]
    for token in expired:
        preview_cache.pop(token, None)


def store_preview(token: str, records: list[dict[str, Any]], changes: list[dict[str, Any]]) -> None:
    now = monotonic()
    with _preview_lock:
        _drop_expired_previews(now)
        if len(preview_cache) >= MAX_PREVIEWS:
            oldest = min(preview_cache, key=lambda key: preview_cache[key]["expires_at"])
            preview_cache.pop(oldest, None)
        preview_cache[token] = {
            "records": deepcopy(records),
            "changes": to_json_safe(changes),
            "expires_at": now + PREVIEW_TTL_SECONDS,
        }


def get_live_preview(token: str) -> dict[str, Any]:
    with _preview_lock:
        _drop_expired_previews(monotonic())
        cached = preview_cache.get(token)

    if cached is None:
        raise ValueError("Preview not found, expired, or already applied. Generate a new preview.")
    return cached


def consume_preview(token: str) -> None:
    with _preview_lock:
        preview_cache.pop(token, None)


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ml-data-cleaning",
        "version": "1.0.0",
    }


@app.post("/api/analyze")
def analyze_dataset(request: AnalyzeRequest) -> dict[str, Any]:
    with client_errors():
        df = records_to_dataframe(request.records)
        validate_dataset(df)

        issues = detect_quality_issues(
            df,
            request.rules,
            request.contamination,
            request.exclude_columns,
        )

        return to_json_safe({
            "profile": profile_dataset(df),
            "issues": issues,
        })


@app.post("/api/clean")
def clean_records(
    records: list[dict[str, Any]],
    imputation_method: ImputationMethod = "auto",
    remove_duplicates: bool = False,
    trim_whitespace: bool = True,
    contamination: float = 0.05,
    rules_json: str = "{}",
    exclude_columns_json: str = "[]",
) -> dict[str, Any]:
    with client_errors():
        options = options_from_form(
            imputation_method, remove_duplicates, trim_whitespace,
            contamination, rules_json, exclude_columns_json,
        )
        df = records_to_dataframe(records)
        validate_dataset(df)
        cleaned, report = run_workflow(df, options)

        return to_json_safe({
            "cleaned_records": dataframe_records(cleaned),
            "report": report,
        })


@app.post("/api/clean/preview")
def preview_cleaning(request: CleanRequest) -> dict[str, Any]:
    started = perf_counter()

    with client_errors():
        df = records_to_dataframe(request.records)
        validate_dataset(df)

        cleaned, report = run_workflow(df, request)

        changes = get_reviewable_changes(
            report["repair_summary"]["operations"],
            report["detected_issues"].get("outliers"),
        )

        preview_token = str(uuid4())
        # The uploaded records are stored exactly as received. Repairs are
        # applied later, and only for the change IDs the user approves.
        store_preview(preview_token, request.records, changes)

        logger.info(
            "Preview for %d rows generated in %.3fs with %d changes",
            len(df), perf_counter() - started, len(changes),
        )

        return to_json_safe({
            "message": "Preview generated successfully.",
            "preview_token": preview_token,
            "changes": changes,
            "preview_records": dataframe_records(cleaned),
            "report": report,
        })


@app.post("/api/clean/apply")
def apply_approved_changes(request: ApplyChangesRequest) -> dict[str, Any]:
    with client_errors():
        cached = get_live_preview(request.preview_token)

        changes_by_id = {change["id"]: change for change in cached["changes"]}
        accepted_ids = request.accepted_change_ids

        if len(accepted_ids) != len(set(accepted_ids)):
            raise ValueError("Duplicate change IDs are not allowed.")

        unknown_ids = set(accepted_ids) - set(changes_by_id)
        if unknown_ids:
            raise ValueError(f"Unknown change IDs: {', '.join(sorted(unknown_ids))}")

        # Start from the exact uploaded values, so rejected changes leave data untouched.
        cleaned = pd.DataFrame(deepcopy(cached["records"])).astype(object)
        rows_to_remove: set[Any] = set()

        for change_id in accepted_ids:
            change = changes_by_id[change_id]
            row_index = change["row_index"]

            # Outliers are review-only; approving one must not alter values.
            if change["type"] == "outlier_review":
                continue

            if row_index not in cleaned.index:
                raise ValueError(f"Row index '{row_index}' is not present in the dataset.")

            if change["type"] == "exact_duplicate_removal":
                rows_to_remove.add(row_index)
                continue

            column = change["column"]
            if column not in cleaned.columns:
                raise ValueError(f"Column '{column}' is not present in the dataset.")

            cleaned.at[row_index, column] = change["proposed_value"]

        if rows_to_remove:
            cleaned = cleaned.drop(index=list(rows_to_remove))

        consume_preview(request.preview_token)

        return to_json_safe({
            "message": "Approved changes applied successfully.",
            "cleaned_records": dataframe_records(cleaned),
            "applied_change_ids": accepted_ids,
            "applied_count": len(accepted_ids),
            "rows_removed": len(rows_to_remove),
        })


@app.post("/api/datasets/analyze-upload")
async def analyze_upload(
    file: UploadFile = File(...),
    rules_json: str = Form("{}"),
    contamination: float = Form(0.05),
    exclude_columns_json: str = Form("[]"),
    sheet_name: str | None = Form(None),
) -> dict[str, Any]:
    with client_errors():
        df = await read_upload(file, sheet_name)
        rules = _parse_json(rules_json, dict, "rules_json")
        exclude_columns = _parse_json(exclude_columns_json, list, "exclude_columns_json")
        CleanOptions(rules=rules, exclude_columns=exclude_columns, contamination=contamination)
        validate_dataset(df)

        return to_json_safe({
            "filename": file.filename,
            "profile": profile_dataset(df),
            "issues": detect_quality_issues(df, rules, contamination, exclude_columns),
        })


@app.post("/api/datasets/clean-upload")
async def clean_upload(
    file: UploadFile = File(...),
    imputation_method: str = Form("auto"),
    remove_duplicates: bool = Form(False),
    trim_whitespace: bool = Form(True),
    contamination: float = Form(0.05),
    rules_json: str = Form("{}"),
    exclude_columns_json: str = Form("[]"),
    sheet_name: str | None = Form(None),
) -> dict[str, Any]:
    with client_errors():
        df = await read_upload(file, sheet_name)
        options = options_from_form(
            imputation_method, remove_duplicates, trim_whitespace,
            contamination, rules_json, exclude_columns_json,
        )
        cleaned, report = run_workflow(df, options)

        return to_json_safe({
            "filename": file.filename,
            "cleaned_csv": dataframe_to_csv_bytes(cleaned).decode("utf-8-sig"),
            "report": report,
            "download_endpoint": (
                "This endpoint is not persistent; use cleaned_csv "
                "from this response to save the output."
            ),
        })


@app.post("/api/datasets/clean-upload/csv")
async def clean_upload_csv(
    file: UploadFile = File(...),
    imputation_method: str = Form("auto"),
    remove_duplicates: bool = Form(False),
    trim_whitespace: bool = Form(True),
    contamination: float = Form(0.05),
    rules_json: str = Form("{}"),
    exclude_columns_json: str = Form("[]"),
    sheet_name: str | None = Form(None),
) -> Response:
    """Return a downloadable cleaned CSV."""
    with client_errors():
        df = await read_upload(file, sheet_name)
        options = options_from_form(
            imputation_method, remove_duplicates, trim_whitespace,
            contamination, rules_json, exclude_columns_json,
        )
        cleaned, _ = run_workflow(df, options)

        return Response(
            content=dataframe_to_csv_bytes(cleaned),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": "attachment; filename=cleaned_dataset.csv",
            },
        )
