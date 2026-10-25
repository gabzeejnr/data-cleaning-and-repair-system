from __future__ import annotations
from io import BytesIO
from pathlib import Path
from typing import Any
import pandas as pd

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def read_dataset(filename: str, content: bytes) -> pd.DataFrame:
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Upload a CSV or Excel spreadsheet.")

    if not content:
        raise ValueError("The uploaded file is empty.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("File exceeds the 25 MB upload limit.")

    stream = BytesIO(content)

    try:
        if suffix == ".csv":
            df = pd.read_csv(stream)
        else:
            df = pd.read_excel(stream)
    except Exception as exc:
        raise ValueError(f"Could not read dataset: {exc}") from exc

    if df.empty and len(df.columns) == 0:
        raise ValueError("The file contains no tabular data.")

    if len(df.columns) == 0:
        raise ValueError("The dataset must contain at least one column.")

    if not df.columns.is_unique:
        raise ValueError(
            "Column names must be unique. Rename duplicate columns and upload again."
        )

    df.columns = [str(column).strip() for column in df.columns]
    if not df.columns.is_unique:
        raise ValueError("Column names must remain unique after trimming whitespace.")
    return df


def dataframe_to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8-sig")


def records_to_dataframe(records: list[dict[str, Any]]) -> pd.DataFrame:
    """Convert API records into a normalized DataFrame."""
    if not records:
        raise ValueError("At least one record is required.")

    df = pd.DataFrame(records)

    df = df.replace(r"^\s*$", pd.NA, regex=True)

    return df
