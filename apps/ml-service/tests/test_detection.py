import numpy as np
import pandas as pd
import pytest

from app.detection import (
    detect_inconsistent_strings,
    detect_invalid_values,
    detect_outliers,
    detect_quality_issues,
)


def test_missing_and_duplicate_rows_are_reported():
    df = pd.DataFrame({"name": ["Ada", "Ben", "Ben"], "age": [20, None, None]})
    issues = detect_quality_issues(df)
    assert issues["missing_values"][0] == {
        "type": "missing_values", "column": "age", "count": 2,
        "row_indexes": [1, 2], "truncated": False,
    }
    assert issues["duplicates"]["count"] == 1


def test_invalid_values_cover_range_violations_text_and_required_fields():
    df = pd.DataFrame({"age": [20, -1, "unknown", None]})
    issues = detect_invalid_values(df, {"age": {"min": 0, "max": 120, "required": True}})
    assert issues[0]["count"] == 3


def test_invalid_rule_shape_is_rejected():
    df = pd.DataFrame({"age": [1, 2]})
    with pytest.raises(TypeError):
        detect_invalid_values(df, {"age": 5})


def test_whitespace_and_case_variants_are_flagged_but_not_rewritten():
    df = pd.DataFrame({"name": [" Ada", "ada", "Ben"]})
    issues = detect_inconsistent_strings(df)
    kinds = {issue["type"] for issue in issues}
    assert kinds == {"leading_or_trailing_whitespace", "case_or_spacing_variants"}
    assert df.loc[0, "name"] == " Ada"


def test_outlier_detection_flags_extreme_value():
    records = [10, 11, 10, 12, 11, 10, 9, 11, 12, 1000]
    result = detect_outliers(pd.DataFrame({"value": records}), contamination=0.2)
    assert result["available"] is True
    assert 9 in result["row_indexes"]


def test_outlier_detection_excludes_label_columns():
    df = pd.DataFrame({"x": [1.0, 2.0, 3.0, 2.0], "label": [1000, 1, 1, 1]})
    result = detect_outliers(df, contamination=0.25, exclude_columns=["label"])
    assert result["numeric_columns"] == ["x"]


def test_outlier_detection_reports_unavailable_without_numeric_columns():
    result = detect_outliers(pd.DataFrame({"name": ["a", "b"]}))
    assert result["available"] is False


@pytest.mark.parametrize("contamination", [0, -0.1, 0.6])
def test_invalid_contamination_is_rejected(contamination):
    with pytest.raises(ValueError, match="contamination"):
        detect_outliers(pd.DataFrame({"x": [1.0, 2.0, 3.0]}), contamination=contamination)


def test_infinite_values_do_not_break_outlier_detection():
    df = pd.DataFrame({"x": [1.0, 2.0, np.inf, 2.5, 3.0]})
    assert detect_outliers(df, contamination=0.2)["available"] is True
