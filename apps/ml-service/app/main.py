from __future__ import annotations

import json
from typing import Any
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from copy import deepcopy
from uuid import uuid4
from time import time
import pandas as pd

from .io_utils import read_dataset, dataframe_to_csv_bytes, MAX_UPLOAD_BYTES, records_to_dataframe
from .profiling import profile_dataset
from .detection import detect_quality_issues
from .reporting import run_cleaning_workflow
from .repair import get_reviewable_changes

app = FastAPI(
    title="Machine Learning Data Cleaning Service",
    description="Profiles structured datasets, detects quality issues, performs conservative repairs, and produces reports.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREVIEW_TTL_SECONDS = 1800
preview_cache: dict[str, dict[str, Any]] = {}


class AnalyzeRequest(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    exclude_columns: list[str] = Field(default_factory=list)

class ApplyChangesRequest(BaseModel):
    preview_token: str
    accepted_change_ids: list[str] = Field(default_factory=list)
    
class CleanRequest(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    exclude_columns: list[str] = Field(default_factory=list)
    imputation_method: str = "auto"
    remove_duplicates: bool = False
    trim_whitespace: bool = True

class ApplyChangesRequest(BaseModel):
    preview_token: str
    accepted_change_ids: list[str] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {
                "status": "ok",
                "service": "ml-data-cleaning", 
                "version": "1.0.0"
            }


@app.post("/api/analyze")
def analyze_dataset(request: AnalyzeRequest) -> dict[str, Any]:
    try:
        df = pd.DataFrame(request.records)
        if df.empty or len(df.columns) == 0:
            raise ValueError("Provide at least one row and one column.")
        issues = detect_quality_issues(df, request.rules, request.contamination, request.exclude_columns)
        return {"profile": profile_dataset(df), "issues": issues}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/clean")
def clean_records(
    records: list[dict[str, Any]],
    imputation_method: str = "auto",
    remove_duplicates: bool = False,
    trim_whitespace: bool = True,
    contamination: float = 0.05,
    rules_json: str = "{}",
    exclude_columns_json: str = "[]",
) -> dict[str, Any]:
    try:
        rules = json.loads(rules_json)
        exclude_columns = json.loads(exclude_columns_json)
        if not isinstance(rules, dict) or not isinstance(exclude_columns, list):
            raise ValueError("rules_json must be an object and exclude_columns_json must be an array.")
        df = pd.DataFrame(records)
        if df.empty or len(df.columns) == 0:
            raise ValueError("Provide at least one row and one column.")
        cleaned, report = run_cleaning_workflow(df, rules, contamination, exclude_columns, imputation_method, remove_duplicates, trim_whitespace)
        return {"cleaned_records": cleaned.astype(object).where(pd.notna(cleaned), None).to_dict(orient="records"), "report": report}
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc



@app.post("/api/clean/preview")
def preview_cleaning(request: CleanRequest) -> dict[str, Any]:
    try:
        df = records_to_dataframe(request.records)

        if df.empty or len(df.columns) == 0:
            raise ValueError("Provide at least one row and one column.")

        cleaned, report = run_cleaning_workflow(
            df,
            rules=request.rules,
            contamination=request.contamination,
            exclude_columns=request.exclude_columns,
            imputation_method=request.imputation_method,
            remove_duplicates=request.remove_duplicates,
            trim_whitespace=request.trim_whitespace,
        )

        cleaned_records = (
            cleaned.astype(object)
            .where(pd.notna(cleaned), None)
            .to_dict(orient="records")
        )
        
        changes = get_reviewable_changes(report["repair_summary"]["operations"])
        
        preview_token = str(uuid4())
        preview_cache[preview_token] = {
            "records": deepcopy(request.records),
            "changes": deepcopy(changes),
            "expires_at": time() + PREVIEW_TTL_SECONDS,
        }

        return {
            "preview_token": preview_token,
            "preview_records": cleaned_records,
            "report": report,
            "changes": changes
        }

    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc




@app.post("/api/clean/apply")
def apply_approved_changes(request: ApplyChangesRequest) -> dict[str, Any]:
    try:
        cached = preview_cache.get(request.preview_token)

        if cached is None:
            raise ValueError(
                "Preview not found or already applied. Generate a new preview."
            )

        if time() >= cached["expires_at"]:
            preview_cache.pop(request.preview_token, None)
            raise ValueError("Preview expired. Generate a new preview.")

        available_changes = cached["changes"]
        changes_by_id = {
            change["id"]: change
            for change in available_changes
        }

        accepted_ids = request.accepted_change_ids

        if len(accepted_ids) != len(set(accepted_ids)):
            raise ValueError("Duplicate change IDs are not allowed.")

        unknown_ids = set(accepted_ids) - set(changes_by_id)

        if unknown_ids:
            raise ValueError(
                f"Unknown change IDs: {', '.join(sorted(unknown_ids))}"
            )

        original = records_to_dataframe(cached["records"])
        cleaned = original.copy(deep=True)
        rows_to_remove: set[int] = set()

        for change_id in accepted_ids:
            change = changes_by_id[change_id]
            row_index = change["row_index"]

            if change["type"] == "exact_duplicate_removal":
                if row_index not in cleaned.index:
                    raise ValueError(
                        f"Row index '{row_index}' is not present in the dataset."
                    )
                rows_to_remove.add(row_index)
                continue

            column = change["column"]

            if column not in cleaned.columns:
                raise ValueError(
                    f"Column '{column}' is not present in the dataset."
                )

            if row_index not in cleaned.index:
                raise ValueError(
                    f"Row index '{row_index}' is not present in the dataset."
                )

            cleaned.at[row_index, column] = change["proposed_value"]

        if rows_to_remove:
            cleaned = cleaned.drop(index=list(rows_to_remove))

        cleaned_records = (
            cleaned.astype(object)
            .where(pd.notna(cleaned), None)
            .to_dict(orient="records")
        )

        # Consume the preview only after successful application.
        preview_cache.pop(request.preview_token, None)

        return {
            "message": "Approved changes applied successfully.",
            "cleaned_records": cleaned_records,
            "applied_change_ids": accepted_ids,
            "applied_count": len(accepted_ids),
            "rows_removed": len(rows_to_remove),
        }

    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc



@app.post("/api/datasets/analyze-upload")
async def analyze_upload(file: UploadFile = File(...), rules_json: str = Form("{}"), contamination: float = Form(0.05), exclude_columns_json: str = Form("[]")) -> dict[str, Any]:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        df = read_dataset(file.filename or "dataset.csv", content)
        rules = json.loads(rules_json)
        exclude_columns = json.loads(exclude_columns_json)
        if not isinstance(rules, dict) or not isinstance(exclude_columns, list):
            raise ValueError("rules_json must be an object and exclude_columns_json must be an array.")
        return {"filename": file.filename, "profile": profile_dataset(df), "issues": detect_quality_issues(df, rules, contamination, exclude_columns)}
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/datasets/clean-upload")
async def clean_upload(
    file: UploadFile = File(...),
    imputation_method: str = Form("auto"),
    remove_duplicates: bool = Form(False),
    trim_whitespace: bool = Form(True),
    contamination: float = Form(0.05),
    rules_json: str = Form("{}"),
    exclude_columns_json: str = Form("[]"),
) -> dict[str, Any]:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        df = read_dataset(file.filename or "dataset.csv", content)
        rules = json.loads(rules_json)
        exclude_columns = json.loads(exclude_columns_json)
        if not isinstance(rules, dict) or not isinstance(exclude_columns, list):
            raise ValueError("rules_json must be an object and exclude_columns_json must be an array.")
        cleaned, report = run_cleaning_workflow(df, rules, contamination, exclude_columns, imputation_method, remove_duplicates, trim_whitespace)
        csv_bytes = dataframe_to_csv_bytes(cleaned)
        return {
            "filename": file.filename,
            "cleaned_csv": csv_bytes.decode("utf-8-sig"),
            "report": report,
            "download_endpoint": "/api/datasets/clean-upload/download is not persistent; use cleaned_csv from this response to save the output.",
        }
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/datasets/clean-upload/csv")
async def clean_upload_csv(
    file: UploadFile = File(...),
    imputation_method: str = Form("auto"),
    remove_duplicates: bool = Form(False),
    trim_whitespace: bool = Form(True),
    contamination: float = Form(0.05),
    rules_json: str = Form("{}"),
    exclude_columns_json: str = Form("[]"),
) -> Response:
    """Return a downloadable cleaned CSV. Report is available from the JSON endpoint above."""
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        df = read_dataset(file.filename or "dataset.csv", content)
        rules = json.loads(rules_json)
        exclude_columns = json.loads(exclude_columns_json)
        cleaned, _ = run_cleaning_workflow(df, rules, contamination, exclude_columns, imputation_method, remove_duplicates, trim_whitespace)
        output = dataframe_to_csv_bytes(cleaned)
        return Response(content=output, media_type="text/csv; charset=utf-8", headers={"Content-Disposition": "attachment; filename=cleaned_dataset.csv"})
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
