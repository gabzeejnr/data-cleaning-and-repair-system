"""End-to-end checks against the sample files in data/.

These exercise the same endpoints the frontend uses, so they catch problems
that only appear with real-world data: placeholder tokens, padded headers,
label columns, and Excel workbooks.
"""

import io
from pathlib import Path

import pandas as pd
import pytest

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _csv_frame(payload: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(payload))


def _clean_csv(client, name, data_file, **form):
    response = client.post(
        "/api/datasets/clean-upload/csv",
        files={"file": (name, data_file(name), "text/csv")},
        data=form,
    )
    assert response.status_code == 200, response.text
    return response.content


# --- every sample file can be analyzed and cleaned ------------------------

@pytest.mark.parametrize("name", [
    "iris.csv",
    "dirty_cafe_sales.csv",
    "taxi-trips.csv",
    "creditcard_sample.csv",
])
def test_analyze_upload_profiles_every_csv_sample(client, data_file, name):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": (name, data_file(name), "text/csv")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()

    expected_rows = len(pd.read_csv(DATA_DIR / name))
    assert payload["filename"] == name
    assert payload["profile"]["row_count"] == expected_rows
    assert payload["issues"]["missing_values"] is not None


@pytest.mark.parametrize("name", ["iris.csv", "dirty_cafe_sales.csv", "taxi-trips.csv"])
def test_clean_upload_json_response_has_csv_and_report(client, data_file, name):
    response = client.post(
        "/api/datasets/clean-upload",
        files={"file": (name, data_file(name), "text/csv")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["cleaned_csv"].startswith(tuple(_csv_frame(data_file(name)).columns[:1]))
    assert payload["report"]["comparison"]["missing_after"] == 0


# --- cleaning does not silently change clean data -------------------------

@pytest.mark.parametrize("name", ["taxi-trips.csv", "creditcard_sample.csv"])
def test_clean_input_is_returned_unchanged(client, data_file, name):
    """A file with no missing values or padded text should round-trip without changes."""
    source = pd.read_csv(io.BytesIO(data_file(name)))
    cleaned = _csv_frame(_clean_csv(client, name, data_file))

    pd.testing.assert_frame_equal(cleaned, source, check_dtype=False)


def test_iris_headers_are_trimmed_and_values_are_preserved(client, data_file):
    source = pd.read_csv(io.BytesIO(data_file("iris.csv")))
    source.columns = source.columns.str.strip()

    cleaned = _csv_frame(_clean_csv(client, "iris.csv", data_file))

    assert list(cleaned.columns) == ["one", "two", "three", "four", "five"]
    pd.testing.assert_frame_equal(cleaned, source, check_dtype=False)


# --- placeholder tokens in the cafe sales data ----------------------------

def test_cafe_error_tokens_are_treated_as_missing_and_repaired(client, data_file):
    raw = pd.read_csv(io.BytesIO(data_file("dirty_cafe_sales.csv")), dtype=str)
    assert (raw["Total Spent"] == "ERROR").sum() > 0

    cleaned = _csv_frame(_clean_csv(client, "dirty_cafe_sales.csv", data_file))

    assert not cleaned.astype(str).eq("ERROR").any().any()
    assert cleaned["Total Spent"].isna().sum() == 0
    assert pd.api.types.is_numeric_dtype(cleaned["Total Spent"])
    assert pd.api.types.is_integer_dtype(cleaned["Quantity"])


def test_cafe_clean_preview_flow_applies_only_approved_repairs(client, data_file):
    frame = pd.read_csv(io.BytesIO(data_file("dirty_cafe_sales.csv"))).head(200)
    # NaN is not valid JSON; send nulls for missing cells instead.
    records = frame.astype(object).where(frame.notna(), None).to_dict(orient="records")

    preview = client.post(
        "/api/clean/preview",
        json={"records": records, "contamination": 0.05},
    )
    assert preview.status_code == 200, preview.text
    payload = preview.json()
    assert payload["preview_records"][0]["Item"] is not None
    assert len(payload["changes"]) > 0

    assert any(c["type"] == "missing_value_imputation" for c in payload["changes"])
    applied = client.post(
        "/api/clean/apply",
        json={"preview_token": payload["preview_token"], "accepted_change_ids": []},
    ).json()
    assert applied["applied_count"] == 0
    assert any(
        value in (None, "ERROR", "")
        for row in applied["cleaned_records"]
        for value in row.values()
    )


# --- label columns, outliers, and Excel --------------------------------------

def test_label_column_can_be_excluded_from_anomaly_detection(client, data_file):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("iris.csv", data_file("iris.csv"), "text/csv")},
        data={"exclude_columns_json": '["five"]', "contamination": "0.05"},
    )
    assert response.status_code == 200, response.text
    outliers = response.json()["issues"]["outliers"]
    assert outliers["available"] is True
    assert "five" not in outliers["numeric_columns"]


def test_creditcard_class_label_is_excluded_from_outlier_features(client, data_file):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("creditcard_sample.csv", data_file("creditcard_sample.csv"), "text/csv")},
        data={"exclude_columns_json": '["Class"]'},
    )
    assert response.status_code == 200, response.text
    outliers = response.json()["issues"]["outliers"]
    assert "Class" not in outliers["numeric_columns"]
    assert outliers["count"] > 0


def test_excel_workbook_default_sheet_is_read(client, data_file):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("Box-Plots-with-Outliers.xlsx", data_file("Box-Plots-with-Outliers.xlsx"))},
    )
    assert response.status_code == 200, response.text
    assert response.json()["profile"]["row_count"] > 0


def test_excel_workbook_named_sheet_is_read(client, data_file):
    response = client.post(
        "/api/datasets/clean-upload",
        files={"file": ("Box-Plots-with-Outliers.xlsx", data_file("Box-Plots-with-Outliers.xlsx"))},
        data={"sheet_name": "Box Plot 1"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["report"]["comparison"]["rows_before"] > 0


def test_excel_unknown_sheet_is_a_client_error(client, data_file):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("Box-Plots-with-Outliers.xlsx", data_file("Box-Plots-with-Outliers.xlsx"))},
        data={"sheet_name": "No Such Sheet"},
    )
    assert response.status_code == 422


def test_approving_every_change_reproduces_the_previewed_result(client, data_file):
    """Accepting all listed changes must match what the preview promised (numerically).

    Uses a small slice so every repair is listed; change lists are capped per column.
    """
    frame = pd.read_csv(io.BytesIO(data_file("dirty_cafe_sales.csv"))).head(60)
    records = frame.astype(object).where(frame.notna(), None).to_dict(orient="records")

    preview = client.post("/api/clean/preview", json={"records": records}).json()
    all_ids = [change["id"] for change in preview["changes"]]
    applied = client.post(
        "/api/clean/apply",
        json={"preview_token": preview["preview_token"], "accepted_change_ids": all_ids},
    ).json()

    expected = pd.DataFrame(preview["preview_records"])
    actual = pd.DataFrame(applied["cleaned_records"])
    for column in expected.columns:
        if pd.api.types.is_numeric_dtype(expected[column].dropna()):
            expected[column] = pd.to_numeric(expected[column])
            actual[column] = pd.to_numeric(actual[column])

    pd.testing.assert_frame_equal(actual, expected, check_dtype=False)
