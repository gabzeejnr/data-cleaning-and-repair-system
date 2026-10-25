"""HTTP contract tests for the cleaning endpoints (JSON and preview/apply flow)."""

import app.main as main

BROWSER_ORIGIN = {"Origin": "http://localhost:5173"}

RECORDS = [
    {"name": " Alice ", "age": 25},
    {"name": "Bob", "age": None},
]


def _preview(client, records=RECORDS, **extra):
    response = client.post(
        "/api/clean/preview",
        json={"records": records, "trim_whitespace": True, **extra},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _apply(client, token, accepted):
    return client.post(
        "/api/clean/apply",
        json={"preview_token": token, "accepted_change_ids": accepted},
    )


# --- basic endpoints ------------------------------------------------------

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_reports_profile_and_issues(client):
    response = client.post(
        "/api/analyze",
        json={"records": [{"age": 20, "name": "Ada"}, {"age": None, "name": "Ben"}]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["profile"]["row_count"] == 2
    assert payload["profile"]["missing_value_count"] == 1


def test_analyze_treats_placeholder_strings_as_missing(client):
    response = client.post(
        "/api/analyze",
        json={"records": [{"amount": "10"}, {"amount": "ERROR"}, {"amount": "12"}]},
    )
    assert response.json()["profile"]["missing_value_count"] == 1


def test_clean_endpoint_returns_cleaned_records_and_report(client):
    response = client.post(
        "/api/clean",
        json=[{"age": 20, "name": " Ada "}, {"age": None, "name": "Ben"}],
        params={"imputation_method": "median"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["cleaned_records"]) == 2
    assert payload["cleaned_records"][0]["name"] == "Ada"
    assert payload["report"]["comparison"]["missing_after"] == 0


# --- preview / apply ------------------------------------------------------

def test_preview_returns_preview_records_and_changes(client):
    preview = _preview(client)
    assert preview["preview_records"][0]["name"] == "Alice"
    assert preview["preview_records"][1]["age"] is not None
    assert {"preview_token", "changes", "report"} <= preview.keys()


def test_apply_one_approved_change(client):
    preview = _preview(client)
    name_change = next(
        change for change in preview["changes"]
        if change["column"] == "name" and change["row_index"] == 0
    )

    result = _apply(client, preview["preview_token"], [name_change["id"]]).json()

    assert result["cleaned_records"][0]["name"] == "Alice"
    assert result["cleaned_records"][1]["age"] is None
    assert result["applied_change_ids"] == [name_change["id"]]


def test_rejecting_all_changes_returns_exact_uploaded_values(client):
    preview = _preview(client)
    result = _apply(client, preview["preview_token"], []).json()

    assert result["cleaned_records"][0]["name"] == " Alice "
    assert result["cleaned_records"][1]["age"] is None
    assert result["applied_count"] == 0


def test_apply_rejects_unknown_change_id(client):
    preview = _preview(client)
    response = _apply(client, preview["preview_token"], ["not-a-valid-id"])
    assert response.status_code == 422


def test_apply_rejects_duplicate_change_ids(client):
    preview = _preview(client)
    change_id = preview["changes"][0]["id"]
    response = _apply(client, preview["preview_token"], [change_id, change_id])
    assert response.status_code == 422
    assert "Duplicate" in response.json()["detail"]


def test_preview_token_is_consumed_after_apply(client):
    preview = _preview(client)
    assert _apply(client, preview["preview_token"], []).status_code == 200
    second = _apply(client, preview["preview_token"], [])
    assert second.status_code == 422


def test_expired_preview_is_rejected(client, monkeypatch):
    monkeypatch.setattr(main, "PREVIEW_TTL_SECONDS", 0)
    preview = _preview(client)
    response = _apply(client, preview["preview_token"], [])
    assert response.status_code == 422
    assert "expired" in response.json()["detail"]


def test_preview_cache_is_bounded(client, monkeypatch):
    monkeypatch.setattr(main, "MAX_PREVIEWS", 3)
    tokens = [_preview(client)["preview_token"] for _ in range(5)]
    assert len(main.preview_cache) <= 3
    assert tokens[-1] in main.preview_cache


def test_outlier_review_items_are_never_applied_as_value_changes(client):
    records = [{"value": value} for value in [10, 11, 10, 12, 11, 10, 9, 11, 12, 1000]]
    preview = _preview(client, records=records, contamination=0.2, trim_whitespace=False)

    outlier = next(change for change in preview["changes"] if change["type"] == "outlier_review")
    applied = _apply(client, preview["preview_token"], [outlier["id"]]).json()

    assert applied["cleaned_records"] == records
    assert applied["applied_change_ids"] == [outlier["id"]]


def test_exact_duplicate_removal_is_applied_only_when_approved(client):
    records = [{"name": "Ben", "age": 1}, {"name": "Ben", "age": 1}, {"name": "Ada", "age": 2}]
    preview = _preview(client, records=records, remove_duplicates=True, trim_whitespace=False)
    kept = _apply(client, preview["preview_token"], []).json()
    assert len(kept["cleaned_records"]) == 3

    preview = _preview(client, records=records, remove_duplicates=True, trim_whitespace=False)
    duplicate = next(c for c in preview["changes"] if c["type"] == "exact_duplicate_removal")
    removed = _apply(client, preview["preview_token"], [duplicate["id"]]).json()
    assert len(removed["cleaned_records"]) == 2
    assert removed["rows_removed"] == 1


# --- request validation and error handling --------------------------------

def test_invalid_imputation_method_is_a_client_error(client):
    response = client.post(
        "/api/clean/preview",
        json={"records": RECORDS, "imputation_method": "guess"},
    )
    assert response.status_code == 422


def test_contamination_out_of_range_is_a_client_error(client):
    response = client.post(
        "/api/analyze",
        json={"records": RECORDS, "contamination": 0.9},
    )
    assert response.status_code == 422


def test_malformed_rules_json_is_a_client_error(client):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("sample.csv", b"a,b\n1,2\n", "text/csv")},
        data={"rules_json": "{not json"},
    )
    assert response.status_code == 422
    assert "rules_json" in response.json()["detail"]


def test_unexpected_crash_returns_json_500_with_cors_headers(client, monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(main, "run_workflow", boom)
    unsafe_client = type(client)(main.app, raise_server_exceptions=False)

    response = unsafe_client.post(
        "/api/clean/preview",
        json={"records": RECORDS},
        headers=BROWSER_ORIGIN,
    )

    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/json")
    assert "logs" in response.json()["detail"]
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_allows_the_frontend_origin(client):
    response = client.options(
        "/api/clean/preview",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_upload_endpoints_accept_csv(client):
    csv = b"name,age\nAda,20\nBen,\n"
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("sample.csv", csv, "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["profile"]["row_count"] == 2

    response = client.post(
        "/api/datasets/clean-upload/csv",
        files={"file": ("sample.csv", csv, "text/csv")},
    )
    assert response.status_code == 200
    assert "cleaned_dataset.csv" in response.headers["content-disposition"]
    assert b"name,age" in response.content


def test_clean_upload_json_contains_csv_and_report(client):
    response = client.post(
        "/api/datasets/clean-upload",
        files={"file": ("sample.csv", b"name,age\n Ada ,20\nBen,\n", "text/csv")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["cleaned_csv"].splitlines()[1].startswith("Ada,")
    assert payload["report"]["comparison"]["missing_after"] == 0


def test_upload_with_unsupported_type_is_a_client_error(client):
    response = client.post(
        "/api/datasets/analyze-upload",
        files={"file": ("sample.exe", b"x", "application/octet-stream")},
    )
    assert response.status_code == 422
