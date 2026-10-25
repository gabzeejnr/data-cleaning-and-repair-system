import numpy as np
import pandas as pd
import pytest

from app.repair import (
    clean_dataset,
    get_reviewable_changes,
    remove_exact_duplicates,
    repair_missing_values,
    standardize_whitespace,
    validate_dataset,
)


# --- whitespace -----------------------------------------------------------

def test_whitespace_is_trimmed_only_in_text_columns():
    df = pd.DataFrame({"name": [" Ada ", "Ben"], "age": [20, 30]})
    cleaned, changes = standardize_whitespace(df)
    assert list(cleaned["name"]) == ["Ada", "Ben"]
    assert len(changes) == 1
    assert changes[0]["count"] == 1


def test_original_dataframe_is_not_modified_by_cleaning():
    df = pd.DataFrame({"name": [" Ada "], "age": [None]})
    clean_dataset(df, imputation_method="median")
    assert df.loc[0, "name"] == " Ada "
    assert pd.isna(df.loc[0, "age"])


# --- missing values -------------------------------------------------------

def test_numeric_and_categorical_missing_values_are_filled_in_auto_mode():
    df = pd.DataFrame({
        "age": [20.0, None, 40.0, 30.0],
        "city": ["Lagos", None, "Abuja", "Lagos"],
    })
    cleaned, changes = repair_missing_values(df, method="auto")
    assert cleaned["age"].isna().sum() == 0
    assert cleaned["city"].isna().sum() == 0
    assert cleaned.loc[1, "city"] == "Lagos"
    assert df.isna().sum().sum() == 2
    assert len(changes) == 2


@pytest.mark.parametrize("method", ["median", "mean", "mode", "knn", "constant"])
def test_every_method_handles_a_text_column_without_crashing(method):
    df = pd.DataFrame({"item": ["Coffee", None, "Cake"], "qty": [1.0, 2.0, None]})
    cleaned, _ = repair_missing_values(df, method=method)
    assert cleaned["item"].isna().sum() == 0


def test_knn_ignores_numeric_columns_that_are_entirely_empty():
    df = pd.DataFrame({
        "a": [1.0, None, 3.0, 4.0],
        "empty": [np.nan] * 4,
        "b": [1.0, 2.0, None, 4.0],
    })
    cleaned, changes = repair_missing_values(df, method="knn")
    assert cleaned["a"].isna().sum() == 0
    assert cleaned["b"].isna().sum() == 0
    assert cleaned["empty"].isna().sum() == 4
    assert all(change["column"] != "empty" for change in changes)


def test_all_missing_column_is_not_fabricated():
    df = pd.DataFrame({"empty": [None, None, None], "value": [1, 2, 3]})
    cleaned, _ = repair_missing_values(df, method="auto")
    assert cleaned["empty"].isna().sum() == 3


def test_imputed_counts_stay_whole_numbers():
    df = pd.DataFrame({"quantity": [2.0, None, 4.0, 4.0, 1.0]})
    cleaned, _ = repair_missing_values(df, method="knn")
    assert str(cleaned["quantity"].dtype) == "Int64"
    assert cleaned["quantity"].notna().all()


def test_non_integer_numbers_are_not_rounded():
    df = pd.DataFrame({"price": [2.5, None, 4.0]})
    cleaned, _ = repair_missing_values(df, method="median")
    assert cleaned.loc[1, "price"] == pytest.approx(3.25)


def test_invalid_method_is_rejected():
    with pytest.raises(ValueError, match="method must be"):
        repair_missing_values(pd.DataFrame({"a": [1.0, None]}), method="guess")


# --- duplicates -----------------------------------------------------------

def test_exact_duplicates_are_removed_and_reported():
    df = pd.DataFrame({"name": ["Ben", "Ben", "Ada"], "age": [1, 1, 2]})
    cleaned, changes = remove_exact_duplicates(df)
    assert len(cleaned) == 2
    assert changes[0]["type"] == "exact_duplicate_removal"
    assert changes[0]["count"] == 1


# --- summary and review items ---------------------------------------------

def test_cleaning_and_validation_end_to_end():
    df = pd.DataFrame({"name": [" Ada ", "Sam", "Ben", "Ben"], "age": [20.0, None, 35.0, 35.0]})
    cleaned, summary = clean_dataset(df, remove_duplicates=True)
    assert len(cleaned) == 3
    assert cleaned["name"].str.strip().equals(cleaned["name"])
    assert cleaned["age"].isna().sum() == 0
    assert summary["validation"]["valid"] is True
    assert validate_dataset(cleaned)["missing_value_count"] == 0


def test_validation_flags_infinite_values():
    df = pd.DataFrame({"x": [1.0, np.inf]})
    assert validate_dataset(df)["valid"] is False


def test_reviewable_changes_contain_outlier_items_without_column_or_value():
    outliers = {
        "available": True,
        "numeric_columns": ["value"],
        "scores": [{"row_index": 9, "anomaly_score": 0.7}],
    }
    items = get_reviewable_changes([], outliers)
    assert items == [{
        "id": "outlier-9",
        "type": "outlier_review",
        "method": "IsolationForest",
        "row_index": 9,
        "column": None,
        "original_value": None,
        "proposed_value": None,
        "details": {"anomaly_score": 0.7, "numeric_columns": ["value"]},
    }]
