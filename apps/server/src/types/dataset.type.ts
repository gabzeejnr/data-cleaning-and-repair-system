type DatasetRow = Record<string, unknown>;

type CSVErrorDetail = { message: string, row: number | undefined }[];
type UploadSuccess = {
    filename: string,
    rowCount: number,
    columnCount: number,
    columns: string[],
    preview: DatasetRow[]
}

export type { DatasetRow, CSVErrorDetail, UploadSuccess }