type DatasetRow = Record<string, unknown>;

type CSVErrorDetail = { message: string, row: number | undefined }[]

export type { DatasetRow, CSVErrorDetail }