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
    name: string;
    dataType: "number" | "text" | "boolean" | "mixed" | "empty";
    missingCount: number;
    missingPercentage: number;
    uniqueCount: number;
}

interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  totalMissingValues: number;
  columns: ColumnProfile[];
}

export type { DatasetRow, CSVErrorDetail, UploadSuccess, DatasetProfile, ColumnProfile }