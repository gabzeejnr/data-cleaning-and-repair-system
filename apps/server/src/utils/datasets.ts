import type { Dataset } from "@data-cleaning-system/shared"
import type { DatabaseDataset } from "../types/dataset.type.js";

const toDataset = (dataset: DatabaseDataset | DatabaseDataset[]): Dataset | Dataset[] => {

    if (!Array.isArray(dataset)) {
        return {
            id: dataset.id,
            filename: dataset.filename,
            rowCount: dataset.row_count,
            columnCount: dataset.column_count,
            createdAt: dataset.created_at,
            status: dataset.status
        }
    }

    return dataset.map(data => ({
        id: data.id,
        filename: data.filename,
        rowCount: data.row_count,
        columnCount: data.column_count,
        createdAt: data.created_at,
        status: data.status
    }))
}

export { toDataset }