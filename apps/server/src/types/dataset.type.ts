type DatasetRow = Record<string, unknown>;
type CSVErrorDetail = { message: string, row: number | undefined }[];

type UploadSuccess = {
    filename: string,
    rowCount: number,
    columnCount: number,
    columns: string[],
    profile: DatasetProfile,
    preview: DatasetRow[]
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
    rowCount: number;
    columnCount: number;
    duplicateRows: number;
    totalMissingValues: number;
    columns: ColumnProfile[];
}

interface NumericStats {
    count: number;
    mean: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
}

interface Outliers {
    Q1: number,
    Q3: number,
    IQR: number,
    lowerBound: number,
    upperBound: number,
    outliers: unknown[]
}

export type {
    DatasetRow, CSVErrorDetail, UploadSuccess,
    DatasetProfile, ColumnProfile, NumericStats,
    Outliers
}