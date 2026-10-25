"""Conservative, reviewable repairs: whitespace trimming, imputation, and duplicates.

Every repair works on a copy and returns the change list alongside the result,
so callers can show what would change before anything is applied.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer

VALID_IMPUTATION_METHODS = {"auto", "knn", "median", "mean", "mode", "constant"}
MAX_CHANGES_PER_OPERATION = 100


def record_value_changes(
    original: pd.DataFrame,
    cleaned: pd.DataFrame,
    column: str,
    indexes: list[Any],
    operation: str,
    method: str,
) -> dict[str, Any]:
    changes = []

    for index in indexes:
        old_value = original.at[index, column]
        new_value = cleaned.at[index, column]

        changes.append({
            "row_index": int(index) if isinstance(index, (int, np.integer)) else str(index),
            "column": str(column),
            "original_value": old_value.item() if isinstance(old_value, np.generic) else old_value,
            "proposed_value": new_value.item() if isinstance(new_value, np.generic) else new_value,
        })

    return {
        "type": operation,
        "column": str(column),
        "count": len(indexes),
        "method": method,
        "changes": changes[:MAX_CHANGES_PER_OPERATION],
        "truncated": len(changes) > MAX_CHANGES_PER_OPERATION,
    }


def get_reviewable_changes(
    operations: list[dict[str, Any]],
    outliers: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Flatten repair operations and add review-only outlier flags."""
    reviewable: list[dict[str, Any]] = []

    for operation_index, operation in enumerate(operations):
        operation_type = operation["type"]
        change_index = 0

        for change in operation.get("changes", []):
            reviewable.append({
                "id": f"{operation_index}-{change_index}",
                "type": operation_type,
                "method": operation.get("method"),
                **change,
            })
            change_index += 1

        for removed_row in operation.get("removed_rows", []):
            reviewable.append({
                "id": f"{operation_index}-{change_index}",
                "type": operation_type,
                "method": operation.get("method"),
                "row_index": removed_row["row_index"],
                "column": None,
                "original_value": removed_row["original_values"],
                "proposed_value": None,
            })
            change_index += 1

    if outliers and outliers.get("available"):
        for outlier in outliers.get("scores", []):
            row_index = outlier["row_index"]
            reviewable.append({
                "id": f"outlier-{row_index}",
                "type": "outlier_review",
                "method": "IsolationForest",
                "row_index": row_index,
                "column": None,
                "original_value": None,
                "proposed_value": None,
                "details": {
                    "anomaly_score": outlier["anomaly_score"],
                    "numeric_columns": outliers.get("numeric_columns", []),
                },
            })

    return reviewable


# --------------------------------------------------------------------------
# Missing-value imputation
# --------------------------------------------------------------------------

def _resolve_method(method: str, numeric: bool, row_count: int, observed_count: int) -> str:
    if method != "auto":
        return method
    if numeric and row_count >= 3 and observed_count >= 2:
        return "knn"
    return "median" if numeric else "mode"


def _numeric_features(df: pd.DataFrame) -> pd.DataFrame:
    """Numeric columns as float64, dropping columns that have no observed values."""
    features = df.select_dtypes(include="number").replace([np.inf, -np.inf], np.nan)
    return features.dropna(axis=1, how="all").astype("float64")


def _knn_impute(cleaned: pd.DataFrame, column: str) -> str:
    features = _numeric_features(cleaned)
    n_neighbors = min(5, max(1, len(cleaned) - 1))
    imputed = KNNImputer(n_neighbors=n_neighbors, weights="distance").fit_transform(features)

    column_position = features.columns.get_loc(column)
    knn_values = pd.Series(imputed[:, column_position], index=cleaned.index)

    values = cleaned[column].astype("float64")
    missing = values.isna()
    fill = knn_values[missing]

    used_fallback = bool(fill.isna().any())
    if used_fallback:
        # A row with no usable neighbours falls back to the column median.
        fill = fill.fillna(float(values.median()))

    values[missing] = fill
    cleaned[column] = values
    return "KNNImputer+median_fallback" if used_fallback else "KNNImputer"


def _impute_column(cleaned: pd.DataFrame, column: str, selected: str, numeric: bool) -> str:
    """Fill missing values in one column in place. Returns the method label."""
    series = cleaned[column]
    observed = series.dropna()

    if selected == "constant":
        fill_value = 0 if numeric else "UNKNOWN"
        cleaned[column] = series.fillna(fill_value)
        return f"constant({fill_value})"

    if numeric:
        if selected == "knn":
            return _knn_impute(cleaned, column)

        statistic = {
            "median": lambda: observed.median(),
            "mean": lambda: observed.mean(),
            "mode": lambda: observed.mode().iloc[0],
        }[selected]()
        cleaned[column] = series.astype("float64").fillna(float(statistic))
        return selected

    # Text columns cannot use median, mean, or KNN; they use the most frequent value.
    cleaned[column] = series.fillna(observed.mode().iloc[0])
    return "most_frequent_categorical"


def _is_integer_valued(series: pd.Series) -> bool:
    observed = series.dropna()
    return bool(len(observed)) and bool(np.all(np.mod(observed.astype("float64"), 1) == 0))


def repair_missing_values(
    df: pd.DataFrame,
    method: str = "auto",
) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    """Repair missing values on a copy.

    ``auto`` uses KNN for numeric columns with enough data, median for other
    numeric columns, and the most frequent value for text. A column with no
    observed values is left missing rather than invented.
    """
    if method not in VALID_IMPUTATION_METHODS:
        raise ValueError("method must be auto, knn, median, mean, mode, or constant")

    original = df.copy(deep=True)
    cleaned = df.copy(deep=True)
    changes: list[dict[str, Any]] = []

    for column in cleaned.columns:
        series = cleaned[column]
        missing_indexes = cleaned.index[series.isna()].tolist()
        if not missing_indexes:
            continue

        observed_count = int(series.notna().sum())
        if observed_count == 0:
            continue

        numeric = pd.api.types.is_numeric_dtype(series.dtype)
        selected = _resolve_method(method, numeric, len(cleaned), observed_count)
        integer_valued = numeric and _is_integer_valued(series)
        used = _impute_column(cleaned, column, selected, numeric)

        if integer_valued and not cleaned[column].isna().any():
            # Imputation produces floats; keep count-like columns as whole numbers.
            cleaned[column] = cleaned[column].round().astype("Int64")

        filled_indexes = [i for i in missing_indexes if pd.notna(cleaned.at[i, column])]
        if not filled_indexes:
            continue

        changes.append(
            record_value_changes(
                original=original,
                cleaned=cleaned,
                column=column,
                indexes=filled_indexes,
                operation="missing_value_imputation",
                method=used,
            )
        )

    return cleaned, changes


# --------------------------------------------------------------------------
# Whitespace, duplicates, and summary
# --------------------------------------------------------------------------

def standardize_whitespace(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    original = df.copy(deep=True)
    cleaned = df.copy(deep=True)
    changes: list[dict[str, Any]] = []

    for column in cleaned.select_dtypes(include=["object", "string"]).columns:
        before = cleaned[column].copy()
        after = before.map(lambda value: value.strip() if isinstance(value, str) else value)
        changed = before.notna() & (before != after)

        if int(changed.sum()):
            cleaned[column] = after
            changes.append(
                record_value_changes(
                    original=original,
                    cleaned=cleaned,
                    column=column,
                    indexes=cleaned.index[changed].tolist(),
                    operation="whitespace_standardization",
                    method="strip",
                )
            )

    return cleaned, changes


def remove_exact_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    mask = df.duplicated(keep="first")
    indexes = [int(i) for i in df.index[mask].tolist()]
    cleaned = df.loc[~mask].copy()
    changes: list[dict[str, Any]] = []

    if indexes:
        changes.append({
            "type": "exact_duplicate_removal",
            "count": len(indexes),
            "removed_rows": [
                {
                    "row_index": int(index) if isinstance(index, (int, np.integer)) else str(index),
                    "original_values": {
                        str(column): value.item() if isinstance(value, np.generic) else value
                        for column, value in df.loc[index].items()
                    },
                }
                for index in indexes[:MAX_CHANGES_PER_OPERATION]
            ],
            "truncated": len(indexes) > MAX_CHANGES_PER_OPERATION,
        })

    return cleaned, changes


def validate_dataset(df: pd.DataFrame) -> dict[str, Any]:
    numeric = df.select_dtypes(include="number")
    has_infinite = bool(
        np.isinf(numeric.to_numpy(dtype=float, na_value=np.nan)).any()
    ) if not numeric.empty else False

    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "missing_value_count": int(df.isna().sum().sum()),
        "duplicate_row_count": int(df.duplicated().sum()),
        "column_names_unique": bool(df.columns.is_unique),
        "has_infinite_numeric_values": has_infinite,
        "valid": bool(df.columns.is_unique and not has_infinite),
    }


def clean_dataset(
    df: pd.DataFrame,
    imputation_method: str = "auto",
    remove_duplicates: bool = False,
    trim_whitespace: bool = True,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Run conservative repairs. Anomalies and rule violations are reported, never changed."""
    original = df.copy(deep=True)
    cleaned = df.copy(deep=True)
    operations: list[dict[str, Any]] = []

    if trim_whitespace:
        cleaned, changes = standardize_whitespace(cleaned)
        operations.extend(changes)

    cleaned, changes = repair_missing_values(cleaned, imputation_method)
    operations.extend(changes)

    if remove_duplicates:
        cleaned, changes = remove_exact_duplicates(cleaned)
        operations.extend(changes)

    summary = {
        "original_rows": int(len(original)),
        "cleaned_rows": int(len(cleaned)),
        "original_missing_values": int(original.isna().sum().sum()),
        "cleaned_missing_values": int(cleaned.isna().sum().sum()),
        "operations": operations,
        "validation": validate_dataset(cleaned),
    }

    return cleaned, summary
