import io
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.detection import detect_quality_issues
from app.repair import clean_dataset, repair_missing_values, validate_dataset
from app.io_utils import read_dataset

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_profile_and_detection():
    df = pd.DataFrame({"name": [" Ada", "ada", "Ben", "Ben"], "age": [20, None, -2, -2], "score": [10, 11, 12, 12]})
    issues = detect_quality_issues(df, rules={"age": {"min": 0, "max": 120}})
    assert issues["duplicates"]["count"] == 1
    assert any(issue["column"] == "age" for issue in issues["missing_values"])
    assert issues["invalid_values"][0]["count"] == 2
    assert issues["inconsistent_formats"]


def test_numeric_and_categorical_missing_values_are_repaired_without_mutating_original():
    df = pd.DataFrame({"age": [20.0, None, 40.0, 30.0], "city": ["Lagos", None, "Abuja", "Lagos"]})
    cleaned, changes = repair_missing_values(df, method="auto")
    assert cleaned["age"].isna().sum() == 0
    assert cleaned["city"].isna().sum() == 0
    assert df.isna().sum().sum() == 2
    assert len(changes) == 2


def test_all_missing_column_is_not_fabricated():
    df = pd.DataFrame({"empty": [None, None, None], "value": [1, 2, 3]})
    cleaned, _ = repair_missing_values(df, method="auto")
    assert cleaned["empty"].isna().sum() == 3


def test_cleaning_and_validation():
    df = pd.DataFrame({"name": [" Ada ", "Sam", "Ben", "Ben"], "age": [20.0, None, 35.0, 35.0]})
    cleaned, summary = clean_dataset(df, remove_duplicates=True)
    assert len(cleaned) == 3
    assert cleaned["name"].str.strip().equals(cleaned["name"])
    assert cleaned["age"].isna().sum() == 0
    assert summary["validation"]["valid"] is True
    assert validate_dataset(cleaned)["missing_value_count"] == 0


def test_analyze_api():
    response = client.post("/api/analyze", json={"records": [{"age": 20, "name": "Ada"}, {"age": None, "name": "Ben"}]})
    assert response.status_code == 200
    payload = response.json()
    assert payload["profile"]["row_count"] == 2
    assert payload["profile"]["missing_value_count"] == 1


def test_invalid_numeric_text_is_flagged():
    df = pd.DataFrame({"age": [20, -1, "unknown", None]})
    issues = detect_quality_issues(df, rules={"age": {"min": 0, "max": 120}})
    assert issues["invalid_values"][0]["count"] == 2


def test_clean_api():
    response = client.post("/api/clean", json=[{"age": 20, "name": " Ada "}, {"age": None, "name": "Ben"}], params={"imputation_method": "median"})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["cleaned_records"]) == 2
    assert payload["report"]["comparison"]["missing_after"] == 0


def test_csv_upload_and_invalid_extension():
    csv = b"name,age\nAda,20\nBen,\n"
    df = read_dataset("sample.csv", csv)
    assert df.shape == (2, 2)
    with pytest.raises(ValueError, match="Unsupported file type"):
        read_dataset("sample.exe", b"anything")


def test_upload_endpoint():
    csv = b"name,age\nAda,20\nBen,\n"
    response = client.post("/api/datasets/analyze-upload", files={"file": ("sample.csv", csv, "text/csv")})
    assert response.status_code == 200
    assert response.json()["profile"]["row_count"] == 2
    response = client.post("/api/datasets/clean-upload/csv", files={"file": ("sample.csv", csv, "text/csv")})
    assert response.status_code == 200
    assert "cleaned_dataset.csv" in response.headers["content-disposition"]
    assert b"name,age" in response.content



def test_clean_preview_api():
    response = client.post(
        "/api/clean/preview",
        json={
            "records": [
                {"name": " Alice ", "age": 25},
                {"name": "Bob", "age": None},
            ],
            "trim_whitespace": True,
        },
    )

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "preview_token" in result
    assert "preview_records" in result
    assert "report" in result
    assert "changes" in result
    assert result["preview_records"][0]["name"] == "Alice"
    assert result["preview_records"][1]["age"] is not None


def test_apply_one_approved_change():
    records = [
        {"name": " Alice ", "age": 25},
        {"name": "Bob", "age": None},
    ]

    preview_response = client.post(
        "/api/clean/preview",
        json={"records": records, "trim_whitespace": True},
    )
    assert preview_response.status_code == 200, preview_response.json()
    preview = preview_response.json()

    name_change = next(
        change for change in preview["changes"]
        if change["column"] == "name" and change["row_index"] == 0
    )

    response = client.post(
        "/api/clean/apply",
        json={
            "preview_token": preview["preview_token"],
            "accepted_change_ids": [name_change["id"]],
        },
    )

    assert response.status_code == 200, response.json()
    result = response.json()

    assert result["cleaned_records"][0]["name"] == "Alice"
    assert result["cleaned_records"][1]["age"] is None
    assert result["applied_change_ids"] == [name_change["id"]]


def test_rejecting_change_leaves_original_value():
    records = [
        {"name": " Alice ", "age": 25},
        {"name": "Bob", "age": None},
    ]

    preview_response = client.post(
        "/api/clean/preview",
        json={"records": records, "trim_whitespace": True},
    )
    assert preview_response.status_code == 200, preview_response.json()
    preview = preview_response.json()

    response = client.post(
        "/api/clean/apply",
        json={
            "preview_token": preview["preview_token"],
            "accepted_change_ids": [],
        },
    )

    assert response.status_code == 200, response.json()
    result = response.json()

    assert result["cleaned_records"][0]["name"] == " Alice "
    assert result["cleaned_records"][1]["age"] is None
    assert result["applied_count"] == 0


def test_apply_rejects_unknown_change_id():
    records = [
        {"name": " Alice ", "age": 25},
        {"name": "Bob", "age": None},
    ]

    preview_response = client.post(
        "/api/clean/preview",
        json={"records": records, "trim_whitespace": True},
    )
    assert preview_response.status_code == 200, preview_response.json()
    preview = preview_response.json()

    response = client.post(
        "/api/clean/apply",
        json={
            "preview_token": preview["preview_token"],
            "accepted_change_ids": ["not-a-valid-id"],
        },
    )

    assert response.status_code == 422



def test_preview_includes_outlier_review_items_without_auto_repairing_them():
    records = [{"value": value} for value in [10, 11, 10, 12, 11, 10, 9, 11, 12, 1000]]
    response = client.post(
        "/api/clean/preview",
        json={"records": records, "contamination": 0.2, "trim_whitespace": False},
    )

    assert response.status_code == 200, response.json()
    preview = response.json()
    outlier_changes = [
        change for change in preview["changes"]
        if change["type"] == "outlier_review"
    ]
    assert outlier_changes
    assert all(change["column"] is None for change in outlier_changes)
    assert all(change["method"] == "IsolationForest" for change in outlier_changes)

    selected = outlier_changes[0]
    apply_response = client.post(
        "/api/clean/apply",
        json={
            "preview_token": preview["preview_token"],
            "accepted_change_ids": [selected["id"]],
        },
    )
    assert apply_response.status_code == 200, apply_response.json()
    applied = apply_response.json()
    assert applied["cleaned_records"] == records
    assert applied["applied_change_ids"] == [selected["id"]]
