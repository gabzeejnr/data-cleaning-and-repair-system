import math

import numpy as np
import pandas as pd
import pytest

from app.io_utils import (
    normalize_dataframe,
    read_dataset,
    records_to_dataframe,
    to_json_safe,
)


def test_placeholder_strings_become_missing_and_numeric_text_is_inferred():
    df = pd.DataFrame({
        "amount": ["10", "ERROR", " 12 ", "unknown"],
        "city": ["Lagos", "N/A", "Abuja", "Lagos"],
    })
    out = normalize_dataframe(df)
    assert pd.api.types.is_numeric_dtype(out["amount"])
    assert out["amount"].isna().sum() == 2
    assert out["city"].isna().sum() == 1


def test_mixed_text_column_stays_text():
    out = normalize_dataframe(pd.DataFrame({"code": ["12", "AB", None]}))
    assert not pd.api.types.is_numeric_dtype(out["code"])
    assert out["code"].iloc[1] == "AB"


def test_identifier_and_date_columns_are_not_coerced_to_numbers():
    df = pd.DataFrame({
        "zip": ["01234", "56789"],
        "order_id": ["0001", "0002"],
        "created_date": ["2023-01-01", "2023-01-02"],
    })
    out = normalize_dataframe(df)
    assert list(out["zip"]) == ["01234", "56789"]
    assert list(out["order_id"]) == ["0001", "0002"]


def test_records_to_dataframe_rejects_empty_input():
    with pytest.raises(ValueError, match="At least one record"):
        records_to_dataframe([])


def test_read_csv_strips_headers_and_normalizes_values(data_file):
    df = read_dataset("iris.csv", data_file("iris.csv"))
    assert list(df.columns) == ["one", "two", "three", "four", "five"]
    assert df.shape == (150, 5)


def test_read_dataset_rejects_unsupported_extension():
    with pytest.raises(ValueError, match="Unsupported file type"):
        read_dataset("sample.exe", b"anything")


def test_read_dataset_rejects_empty_file():
    with pytest.raises(ValueError, match="empty"):
        read_dataset("sample.csv", b"")


def test_read_dataset_rejects_duplicate_column_names():
    with pytest.raises(ValueError, match="unique"):
        read_dataset("sample.csv", b"a,a\n1,2\n")


def test_read_dataset_rejects_corrupt_excel():
    with pytest.raises(ValueError, match="Could not read dataset"):
        read_dataset("sample.xlsx", b"not really an excel file")


def test_to_json_safe_handles_numpy_and_nonfinite_values():
    payload = {
        "int": np.int64(7),
        "float": np.float64(1.5),
        "nan": float("nan"),
        "inf": np.inf,
        "bool": np.bool_(True),
        "array": np.array([1, 2]),
        "missing": pd.NA,
        "list": [np.int32(3), None],
    }
    result = to_json_safe(payload)
    assert result == {
        "int": 7,
        "float": 1.5,
        "nan": None,
        "inf": None,
        "bool": True,
        "array": [1, 2],
        "missing": None,
        "list": [3, None],
    }
    assert isinstance(result["int"], int)
    assert not math.isnan(result["float"])
