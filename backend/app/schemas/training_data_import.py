"""Schemas for importing training reference data."""

from pydantic import BaseModel


class TrainingDataImportError(BaseModel):
    row: int
    values: dict[str, str]
    error: str


class TrainingDataImportResponse(BaseModel):
    total_rows: int
    imported_rows: int
    error_rows: int
    errors: list[TrainingDataImportError]
