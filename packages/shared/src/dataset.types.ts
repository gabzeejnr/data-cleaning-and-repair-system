type DatasetStatus = "profiled" | "not profiled"
type DatasetRow = Record<string, unknown>

interface Dataset {
    id: string,
    filename: string,
    rowCount: number,
    columnCount: number,
    createdAt: string,
    status: DatasetStatus
}

interface getDatasetIdResponse {
    dataset: Dataset,
    rows: DatasetRow[]
}



export type { Dataset, DatasetRow, getDatasetIdResponse }