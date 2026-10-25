from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def data_file():
    """Return the bytes of a file from the project's data/ folder."""
    def _load(name: str) -> bytes:
        return (DATA_DIR / name).read_bytes()
    return _load
