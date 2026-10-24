import type { DatasetRow } from "@data-cleaning-system/shared";
type CSVErrorDetail = { message: string, row: number | undefined }[];

interface UploadSuccess { datasetId: string }

interface DuplicateReturn {
    datasetId: string,
    selectedColumns: unknown[],
    duplicateGroupCount: number,
    duplicateRowCount: number,
    groups: DatasetRow[][];
}

interface DatabaseDataset {
    id: string,
    filename: string,
    row_count: number,
    column_count: number,
    columns: string[],
    created_at: string,
    expires_at: string,
    status: "profiled" | "not profiled"
}

interface RetrievedDataset {
    id: string,
    file: string,
    columns: string[],
    rows: DatasetRow[],
    expires_at: string
}

// MISSING_VALUE_REPAIR =========================

type RepairStrategy = "mean" | "median" | "mode" | "constant"

interface RepairOptions {
    column: string,
    strategy: RepairStrategy,
    fillValue?: unknown
}

interface RepairResult extends Omit<RepairOptions, 'fillValue'> {
    rows: DatasetRow[],
    replacementValue: unknown,
    repairedCount: number
}

interface MissingValueRepairResult extends RepairResult {
    datasetId: UploadSuccess["datasetId"]
}


// SAVE_CLEANED_DATASET =========================

interface CleanSaveSuccess {
    datasetId: string,
    originalDatasetId: string,
    repairedColumn: string,
    repairedCount: number
}

interface RepairHistory extends RepairResult {
    id: string,
    originalDatasetId: string,
    cleanedDatasetId: string,
    created_at: string
}


export type {
    CSVErrorDetail, UploadSuccess, DuplicateReturn,
    DatabaseDataset, RetrievedDataset, RepairOptions,
    RepairResult, MissingValueRepairResult, CleanSaveSuccess
}