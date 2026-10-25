from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer


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
            "original_value": (
                old_value.item()
                if isinstance(old_value, np.generic)
                else old_value
            ),
            "proposed_value": (
                new_value.item()
                if isinstance(new_value, np.generic)
                else new_value
            ),
        })

    return {
        "type": operation,
        "column": str(column),
        "count": len(indexes),
        "method": method,
        "changes": changes[:100],
        "truncated": len(changes) > 100,
    }




def get_reviewable_changes(operations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flatten repair operations into individually reviewable changes."""
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

    return reviewable


def repair_missing_values(df: pd.DataFrame, method: str = "auto") -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    """Repair missing values on a copy. KNN is used for numeric ML imputation in auto mode."""
    if method not in {"auto", "knn", "median", "mean", "mode", "constant"}:
        raise ValueError("method must be auto, knn, median, mean, mode, or constant")

    original = df.copy(deep=True)
    cleaned = df.copy(deep=True)
    changes: list[dict[str, Any]] = []

    for column in cleaned.columns:
        missing_indexes = cleaned.index[cleaned[column].isna()].tolist()
        if not missing_indexes:
            continue

        original_missing = len(missing_indexes)
        series = cleaned[column]
        numeric = pd.api.types.is_numeric_dtype(series)
        selected = method

        if method == "auto":
            selected = "knn" if numeric and len(cleaned) >= 3 and int(series.notna().sum()) >= 2 else ("median" if numeric else "mode")

        if selected == "knn" and numeric:
            numeric_frame = cleaned.select_dtypes(include="number").replace([np.inf, -np.inf], np.nan)
            
            if series.notna().sum() == 0 or numeric_frame.shape[1] == 0:
                continue
            imputer = KNNImputer(n_neighbors=min(5, max(1, len(cleaned) - 1)), weights="distance")
            transformed = imputer.fit_transform(numeric_frame)
            transformed_frame = pd.DataFrame(transformed, columns=numeric_frame.columns, index=cleaned.index)
            cleaned.loc[missing_indexes, column] = transformed_frame.loc[missing_indexes, column]
            used = "KNNImputer"

        elif selected == "mode" and not numeric:
            if series.notna().sum() == 0:
                continue
            mode_values = series.mode(dropna=True)
            if mode_values.empty:
                continue
            cleaned[column] = series.fillna(mode_values.iloc[0])
            used = "most_frequent_categorical"

        elif selected == "constant":
            fill_value = "UNKNOWN" if not numeric else 0
            cleaned[column] = series.fillna(fill_value)
            used = f"constant({fill_value})"
            
        elif selected in {"median", "mean", "mode"}:
            if series.notna().sum() == 0:
                continue
            strategy = {"median": "median", "mean": "mean", "mode": "most_frequent"}[selected]
            if selected == "mode" and not numeric:
                mode_values = series.mode(dropna=True)
                if mode_values.empty:
                    continue
                cleaned[column] = series.fillna(mode_values.iloc[0])
                used = "most_frequent_categorical"
            else:
                imputer = SimpleImputer(strategy=strategy)
                values = imputer.fit_transform(cleaned[[column]])
                cleaned[column] = values[:, 0]
                used = f"SimpleImputer({strategy})"

        elif selected == "knn" and not numeric:
            # KNNImputer is numeric-only; categorical fields use the most frequent category.

            if series.notna().sum() == 0:
                continue

            cleaned[column] = series.fillna(series.mode(dropna=True).iloc[0])
            used = "most_frequent_fallback_for_categorical"
        else:
            continue

        changes.append(
            record_value_changes(
                original=original,
                cleaned=cleaned,
                column=column,
                indexes=missing_indexes,
                operation="missing_value_imputation",
                method=used,
            )
        )
    return cleaned, changes


def standardize_whitespace(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    original = df.copy(deep=True)
    cleaned = df.copy(deep=True)
    changes: list[dict[str, Any]] = []

    for column in cleaned.select_dtypes(include=["object", "string"]).columns:
        before = cleaned[column].copy()
        after = before.map(lambda value: value.strip() if isinstance(value, str) else value)
        changed = before.notna() & (before != after)
        count = int(changed.sum())

        if count:
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
    changes = []

    if indexes:
        changes.append({
            "type": "exact_duplicate_removal",
            "count": len(indexes),
            "removed_rows": [
                {
                    "row_index": (
                        int(index)
                        if isinstance(index, (int, np.integer))
                        else str(index)
                    ),
                    "original_values": {
                        str(column): (
                            value.item()
                            if isinstance(value, np.generic)
                            else value
                        )
                        for column, value in df.loc[index].items()
                    },
                }
                for index in indexes[:100]
            ],
            "truncated": len(indexes) > 100
        })

    return cleaned, changes


def validate_dataset(df: pd.DataFrame) -> dict[str, Any]:
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "missing_value_count": int(df.isna().sum().sum()),
        "duplicate_row_count": int(df.duplicated().sum()),
        "column_names_unique": bool(df.columns.is_unique),
        "has_infinite_numeric_values": bool(np.isinf(df.select_dtypes(include="number").to_numpy(dtype=float, na_value=np.nan)).any()) if len(df.select_dtypes(include="number").columns) else False,
        "valid": bool(df.columns.is_unique and not np.isinf(df.select_dtypes(include="number").to_numpy(dtype=float, na_value=np.nan)).any()),
    }


def clean_dataset(df: pd.DataFrame, imputation_method: str = "auto", remove_duplicates: bool = False, trim_whitespace: bool = True) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Run conservative repairs; anomalies/invalid values are reported, never silently changed."""
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

