type DatasetStatus = "profiled"

interface Dataset {
    id: string,
    filename: string,
    rowCount: number,
    columnCount: number,
    createdAt: string,
    status: DatasetStatus
}




export type { Dataset }