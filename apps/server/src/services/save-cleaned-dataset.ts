import { randomUUID } from "node:crypto";
import { pool } from "../configs/db.js";
import { persistDataset } from "../repositories/dataset.repository.js";
import type { DatasetRow, RetrievedDataset } from "../types/dataset.type.js";

async function saveCleanedDatasetService(datasetId: string, dataset: RetrievedDataset, rows: DatasetRow[]) {
    const client = await pool.connect();
    try {
        client.query("BEGIN");
        const newDatasetId = randomUUID();

        await persistDataset(
            newDatasetId,
            `${datasetId}-${dataset.file}-cleaned`,
            dataset.columns,
            rows
        )

        await 

        client.query("COMMIT");
    } catch (err) {
        client.query("ROLLBACK");
        throw err;
    } finally {
        client.release()
    }
}

export { saveCleanedDatasetService }