from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import make_pipeline


def detect_missing_values(df: pd.DataFrame) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    for column in df.columns:
        indexes = df.index[df[column].isna()].tolist()
        if indexes:
            issues.append({"type": "missing_values", "column": str(column), "count": len(indexes), "row_indexes": [int(i) for i in indexes[:100] ], "truncated": len(indexes) > 100})
    return issues


def detect_duplicates(df: pd.DataFrame) -> dict[str, Any]:
    mask = df.duplicated(keep="first")
    indexes = df.index[mask].tolist()
    return {"type": "duplicate_rows", "count": int(mask.sum()), "row_indexes": [int(i) for i in indexes[:100]], "truncated": len(indexes) > 100}



def detect_inconsistent_strings(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Flag likely whitespace/case inconsistencies without silently rewriting meaning."""
    issues: list[dict[str, Any]] = []

    for column in df.select_dtypes(include=["object", "string"]).columns:
        series = df[column].dropna().astype(str)

        whitespace_mask = series != series.str.strip()
        whitespace_rows = series.index[whitespace_mask].tolist()

        groups: dict[str, set[str]] = {}

        for value in series:
            normalized = value.strip().casefold()
            groups.setdefault(normalized, set()).add(value)

        variants = [
            sorted(original_values)[:10]
            for original_values in groups.values()
            if len(original_values) > 1
        ]

        if whitespace_rows:
            issues.append({
                "type": "leading_or_trailing_whitespace",
                "column": str(column),
                "count": len(whitespace_rows),
                "row_indexes": [
                    int(i) for i in whitespace_rows[:100]
                ],
                "truncated": len(whitespace_rows) > 100,
            })

        if variants:
            issues.append({
                "type": "case_or_spacing_variants",
                "column": str(column),
                "variant_groups": variants[:50],
                "truncated": len(variants) > 50,
            })

    return issues


def detect_invalid_values(df: pd.DataFrame, rules: dict[str, dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Apply user-supplied constraints, e.g. {"age": {"min": 0, "max": 120}}."""
    issues: list[dict[str, Any]] = []
    for column, rule in (rules or {}).items():
        if column not in df.columns:
            continue
        series = pd.to_numeric(df[column], errors="coerce")
        invalid = pd.Series(False, index=df.index)
        if "min" in rule or "max" in rule:
            
            invalid |= df[column].notna() & series.isna()
        if "min" in rule:
            invalid |= series.notna() & (series < float(rule["min"]))
        if "max" in rule:
            invalid |= series.notna() & (series > float(rule["max"]))
        if rule.get("required"):
            invalid |= df[column].isna()
        indexes = df.index[invalid].tolist()
        if indexes:
            issues.append({"type": "invalid_values", "column": str(column), "count": len(indexes), "row_indexes": [int(i) for i in indexes[:100]], "rules": rule, "truncated": len(indexes) > 100})
    return issues


def detect_outliers(df: pd.DataFrame, contamination: float = 0.05, exclude_columns: list[str] | None = None) -> dict[str, Any]:
    """Use Isolation Forest to flag unusual rows; flags are suggestions, not proof of errors."""
    if not 0 < contamination <= 0.5:
        raise ValueError("contamination must be greater than 0 and at most 0.5")
    numeric = df.drop(columns=exclude_columns or [], errors="ignore").select_dtypes(include="number")
    numeric = numeric.replace([np.inf, -np.inf], np.nan)
    numeric = numeric.dropna(axis=1, how="all")
    if len(df) < 2 or numeric.shape[1] == 0:
        return {"available": False, "reason": "At least two rows and one usable numeric column are required.", "count": 0, "row_indexes": [], "scores": []}
    model = make_pipeline(SimpleImputer(strategy="median"), IsolationForest(contamination=contamination, random_state=42, n_estimators=100))
    predictions = model.fit_predict(numeric)
    scores = -model.decision_function(numeric) 
    indexes = [int(i) for i, prediction in zip(df.index, predictions) if prediction == -1]
    results = [{"row_index": int(i), "anomaly_score": round(float(score), 6)} for i, prediction, score in zip(df.index, predictions, scores) if prediction == -1]
    return {"available": True, "method": "IsolationForest", "note": "Anomalies require review; unusual does not necessarily mean incorrect.", "numeric_columns": [str(c) for c in numeric.columns], "count": len(indexes), "row_indexes": indexes[:100], "truncated": len(indexes) > 100, "scores": results[:100]}



def detect_quality_issues(
    df: pd.DataFrame,
    rules: dict[str, dict[str, Any]] | None = None,
    contamination: float = 0.05,
    exclude_columns: list[str] | None = None,
) -> dict[str, Any]:
    issues = {}

    detectors = [
        ("missing_values", lambda: detect_missing_values(df)),
        ("duplicates", lambda: detect_duplicates(df)),
        ("inconsistent_formats", lambda: detect_inconsistent_strings(df)),
        ("invalid_values", lambda: detect_invalid_values(df, rules)),
        ("outliers", lambda: detect_outliers(df, contamination, exclude_columns)),
    ]

    for name, detector in detectors:
        issues[name] = detector()

    return issues