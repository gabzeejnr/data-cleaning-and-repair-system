type DatasetStatus = "profiled" | "not profiled"
type DatasetRow = Record<string, unknown>;
type DataType = "number" | "text" | "boolean" | "mixed" | "empty"
type IssueType = "missing_values" | "duplicate_rows" | "outliers";
type IssueSeverity = "low" | "medium" | "high"

interface Dataset {
    id: string,
    filename: string,
    rowCount: number,
    columnCount: number,
    createdAt: string,
    status: DatasetStatus
}
interface DatasetProfile {
    rowCount: number,
    columnCount: number,
    duplicateRows: number,
    totalMissingValues: number,
    columns: ColumnProfile[],
}

interface getDatasetIdResponse {
    dataset: Dataset,
    rows: DatasetRow[];
    profile: DatasetProfile | null
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

interface ColumnProfile {
    name: string,
    dataType: DataType,
    missingCount: number,
    missingPercentage: number,
    uniqueCount: number,
    numericStats?: NumericStats,
    outlierAnalysis?: Outliers | null
}


interface DataIssue {
    id: string,
    datasetId: string,
    type: IssueType,
    severity: IssueSeverity,
    column?: string,
    description: string,
    affectedRows: number
}


interface CleaningReportInput {
    errorType: string;
    recordsAffected: number;
    actionTaken: string;
}


export type {
    ColumnProfile, DataIssue, Dataset,
    DatasetRow, DatasetProfile, getDatasetIdResponse,
    IssueSeverity,
    NumericStats, Outliers,
    CleaningReportInput
}