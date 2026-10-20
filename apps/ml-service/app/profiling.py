from __future__ import annotations

from typing import Any
import pandas as pd


def _json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def profile_dataset(df: pd.DataFrame) -> dict[str, Any]:
    """Return dataset-level and per-column quality statistics."""
    columns: list[dict[str, Any]] = []
    for name in df.columns:
        series = df[name]
        non_missing = series.dropna()
        columns.append({
            "name": str(name),
            "dtype": str(series.dtype),
            "total_values": int(len(series)),
            "missing_values": int(series.isna().sum()),
            "missing_percent": round(float(series.isna().mean() * 100), 2) if len(series) else 0.0,
            "unique_values": int(series.nunique(dropna=True)),
            "sample_values": [_json_value(v) for v in non_missing.head(5).tolist()],
        })
    numeric = df.select_dtypes(include="number")
    numeric_summary: dict[str, Any] = {}
    for name in numeric.columns:
        values = numeric[name]
        numeric_summary[str(name)] = {
            "min": _json_value(values.min()),
            "max": _json_value(values.max()),
            "mean": _json_value(values.mean()),
            "median": _json_value(values.median()),
            "standard_deviation": _json_value(values.std()),
        }
    duplicate_rows = int(df.duplicated().sum())
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "missing_value_count": int(df.isna().sum().sum()),
        "duplicate_row_count": duplicate_rows,
        "columns": columns,
        "numeric_summary": numeric_summary,
    }
