from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
import pandas as pd
from .profiling import profile_dataset
from .detection import detect_quality_issues
from .repair import clean_dataset


def build_cleaning_report(original: pd.DataFrame, cleaned: pd.DataFrame, issues: dict[str, Any], repair_summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "report_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "original_profile": profile_dataset(original),
        "cleaned_profile": profile_dataset(cleaned),
        "detected_issues": issues,
        "repair_summary": repair_summary,
        "comparison": {
            "rows_before": int(len(original)),
            "rows_after": int(len(cleaned)),
            "columns_before": int(len(original.columns)),
            "columns_after": int(len(cleaned.columns)),
            "missing_before": int(original.isna().sum().sum()),
            "missing_after": int(cleaned.isna().sum().sum()),
            "duplicates_before": int(original.duplicated().sum()),
            "duplicates_after": int(cleaned.duplicated().sum()),
        },
        "review_note": "Outliers and rule violations are flagged for review. Detection alone does not prove a value is wrong.",
    }


def run_cleaning_workflow(df: pd.DataFrame, rules: dict[str, dict[str, Any]] | None = None, contamination: float = 0.05, exclude_columns: list[str] | None = None, imputation_method: str = "auto", remove_duplicates: bool = False, trim_whitespace: bool = True) -> tuple[pd.DataFrame, dict[str, Any]]:
    original = df.copy(deep=True)
    issues = detect_quality_issues(original, rules=rules, contamination=contamination, exclude_columns=exclude_columns)
    cleaned, repair_summary = clean_dataset(original, imputation_method=imputation_method, remove_duplicates=remove_duplicates, trim_whitespace=trim_whitespace)
    report = build_cleaning_report(original, cleaned, issues, repair_summary)
    return cleaned, report
