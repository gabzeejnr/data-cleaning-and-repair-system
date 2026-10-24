from __future__ import annotations

import json
from typing import Any
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
import pandas as pd

from .io_utils import read_dataset, dataframe_to_csv_bytes, MAX_UPLOAD_BYTES
from .profiling import profile_dataset
from .detection import detect_quality_issues
from .reporting import run_cleaning_workflow

app = FastAPI(
    title="Machine Learning Data Cleaning Service",
    description="Profiles structured datasets, detects quality issues, performs conservative repairs, and produces reports.",
    version="1.0.0",
)


class AnalyzeRequest(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    exclude_columns: list[str] = Field(default_factory=list)


class CleanRequest(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1)
    rules: dict[str, dict[str, Any]] = Field(default_factory=dict)
    contamination: float = Field(default=0.05, gt=0, le=0.5)
    exclude_columns: list[str] = Field(default_factory=list)
    imputation_method: str = "auto"
    remove_duplicates: bool = False
    trim_whitespace: bool = True


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml-data-cleaning", "version": "1.0.0"}


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
        df = pd.DataFrame(request.records)

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

        return {
            "preview_records": cleaned_records,
            "report": report,
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
