type DatasetRow = Record<string, unknown>;
type CSVErrorDetail = { message: string, row: number | undefined }[];

type UploadSuccess = { datasetId: string }

interface DatabaseDataset {
    id: string,
    filename: string,
    row_count: number,
    column_count: number,
    columns: string[],
    created_at: string,
    expires_at: string
}

interface RetrievedDataset {
    id: string,
    file: string,
    columns: string[],
    rows: DatasetRow[],
    expires_at: string
}


interface DuplicateReturn {
    datasetId: string,
    selectedColumns: unknown[],
    duplicateGroupCount: number,
    duplicateRowCount: number,
    groups: DatasetRow[][];
}

interface ColumnProfile {
    name: string,
    dataType: "number" | "text" | "boolean" | "mixed" | "empty",
    missingCount: number,
    missingPercentage: number,
    uniqueCount: number,
    numericStats?: NumericStats,
    outlierAnalysis?: Outliers | null
}

interface DatasetProfile {
    rowCount: number,
    columnCount: number,
    duplicateRows: number,
    // duplicates: DatasetRow[][],
    totalMissingValues: number,
    columns: ColumnProfile[],
}

interface NumericStats {
    count: number,
    mean: number | null,
    median: number | null,
    min: number | null,
    max: number | null
}

interface Outliers {
    Q1: number,
    Q3: number,
    IQR: number,
    lowerBound: number,
    upperBound: number,
    outliers: unknown[]
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
    DatasetRow, CSVErrorDetail, UploadSuccess,
    DatasetProfile, ColumnProfile, NumericStats,
    Outliers, DuplicateReturn, DatabaseDataset, RetrievedDataset,
    RepairOptions, RepairResult, MissingValueRepairResult,
    CleanSaveSuccess
}