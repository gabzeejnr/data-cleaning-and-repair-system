from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer


def repair_missing_values(df: pd.DataFrame, method: str = "auto") -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    """Repair missing values on a copy. KNN is used for numeric ML imputation in auto mode."""
    if method not in {"auto", "knn", "median", "mean", "mode", "constant"}:
        raise ValueError("method must be auto, knn, median, mean, mode, or constant")

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

        changes.append({"type": "missing_value_imputation", "column": str(column), "count": original_missing, "row_indexes": [int(i) for i in missing_indexes[:100]], "method": used})
    return cleaned, changes


def standardize_whitespace(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    cleaned = df.copy(deep=True)
    changes: list[dict[str, Any]] = []

    for column in cleaned.select_dtypes(include=["object", "string"]).columns:
        before = cleaned[column].copy()
        after = before.map(lambda value: value.strip() if isinstance(value, str) else value)
        changed = before.notna() & (before != after)
        count = int(changed.sum())

        if count:
            cleaned[column] = after
            changes.append({"type": "whitespace_standardization", "column": str(column), "count": count, "row_indexes": [int(i) for i in cleaned.index[changed][:100]]})

    return cleaned, changes


def remove_exact_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    mask = df.duplicated(keep="first")
    indexes = [int(i) for i in df.index[mask].tolist()]
    cleaned = df.loc[~mask].copy()
    changes = []

    if indexes:
        changes.append({"type": "exact_duplicate_removal", "count": len(indexes), "removed_row_indexes": indexes[:100], "truncated": len(indexes) > 100})

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