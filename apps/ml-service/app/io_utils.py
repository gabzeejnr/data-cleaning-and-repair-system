"""Reading, normalizing, and serializing tabular data.

All entry points (JSON records and uploaded files) go through
``normalize_dataframe`` so that the same input produces the same types
regardless of how it arrived.
"""

from __future__ import annotations

import csv
import io
import math
import re
from collections.abc import Iterable
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

# Placeholder strings treated as missing (compared case-insensitively, trimmed).
MISSING_TOKENS = frozenset({
    "", "na", "n/a", "nan", "null", "none", "missing",
    "unknown", "error", "err", "?",
})

# Columns whose values should never be coerced to numbers.
_IDENTIFIER_PATTERN = re.compile(
    r"(^id$|_id$|transaction.?id|account.?number|phone|postal.?code|zip)"
)
_DATE_PATTERN = re.compile(r"(date|time|timestamp)")


def _is_textual(series: pd.Series) -> bool:
    return (
        pd.api.types.is_object_dtype(series.dtype)
        or pd.api.types.is_string_dtype(series.dtype)
    )


def normalize_dataframe(
    df: pd.DataFrame,
    missing_tokens: Iterable[str] = MISSING_TOKENS,
) -> pd.DataFrame:
    """Turn placeholder strings into missing values and infer numeric columns.

    A text column becomes numeric only when every non-missing value parses as
    a number. Identifier and date-like columns are left as text.
    """
    df = df.copy()
    tokens = {token.strip().casefold() for token in missing_tokens}

    for column in df.columns:
        if _is_textual(df[column]):
            values = df[column].astype("string")
            missing_mask = values.str.strip().str.casefold().isin(tokens)
            df[column] = values.mask(missing_mask, pd.NA)

    for column in df.columns:
        name = str(column).strip().casefold()
        if _IDENTIFIER_PATTERN.search(name) or _DATE_PATTERN.search(name):
            continue

        series = df[column]
        if not _is_textual(series):
            continue

        non_missing = series.dropna()
        if non_missing.empty:
            continue

        if pd.to_numeric(non_missing.str.strip(), errors="coerce").notna().all():
            df[column] = pd.to_numeric(series.str.strip(), errors="coerce")

    return df


def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate shape and column names of a freshly read table, then normalize it."""
    if len(df.columns) == 0:
        raise ValueError("The dataset must contain at least one column.")

    if not df.columns.is_unique:
        raise ValueError(
            "Column names must be unique. Rename duplicate columns and upload again."
        )

    df.columns = [str(column).strip() for column in df.columns]
    if not df.columns.is_unique:
        raise ValueError("Column names must remain unique after trimming whitespace.")

    return normalize_dataframe(df)


def read_dataset(
    filename: str,
    content: bytes,
    sheet_name: str | None = None,
) -> pd.DataFrame:
    """Parse an uploaded CSV or Excel file into a normalized DataFrame."""
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Upload a CSV or Excel spreadsheet.")

    if not content:
        raise ValueError("The uploaded file is empty.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("File exceeds the 25 MB upload limit.")

    try:
        if suffix == ".csv":
            header = _raw_csv_header(content)
            df = pd.read_csv(BytesIO(content))
        else:
            header = _raw_excel_header(content, sheet_name)
            df = pd.read_excel(BytesIO(content), sheet_name=sheet_name or 0)
    except Exception as exc:
        raise ValueError(f"Could not read dataset: {exc}") from exc

    _reject_duplicate_headers(header)

    return prepare_dataframe(df)


def _raw_csv_header(content: bytes) -> list[str]:
    text = content.decode("utf-8-sig", errors="replace")
    return next(csv.reader(io.StringIO(text)), [])


def _raw_excel_header(content: bytes, sheet_name: str | None) -> list[str]:
    # pandas renames duplicate headers ("a" -> "a.1") without warning, so read the raw row.
    row = pd.read_excel(BytesIO(content), sheet_name=sheet_name or 0, header=None, nrows=1)
    return [str(value) for value in row.iloc[0].tolist() if pd.notna(value)] if len(row) else []


def _reject_duplicate_headers(names: list[str]) -> None:
    stripped = [str(name).strip() for name in names]
    if len(set(stripped)) != len(stripped):
        raise ValueError(
            "Column names must be unique. Rename duplicate columns and upload again."
        )


def dataframe_to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8-sig")


def records_to_dataframe(
    records: list[dict[str, Any]],
    missing_tokens: Iterable[str] = MISSING_TOKENS,
) -> pd.DataFrame:
    """Convert API records into a normalized DataFrame."""
    if not records:
        raise ValueError("At least one record is required.")

    return normalize_dataframe(pd.DataFrame(records), missing_tokens)


def to_json_safe(value: Any) -> Any:
    """Convert pandas and NumPy values into JSON-serializable values."""
    if value is None or value is pd.NA or value is pd.NaT:
        return None

    if isinstance(value, dict):
        return {str(key): to_json_safe(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [to_json_safe(item) for item in value]

    if isinstance(value, np.ndarray):
        return to_json_safe(value.tolist())

    if isinstance(value, np.bool_):
        return bool(value)

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(value) else None

    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()

    return value
