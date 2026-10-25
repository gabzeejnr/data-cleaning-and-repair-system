import { randomUUID } from "node:crypto";
import { pool } from "../configs/db.js";
import { persistDataset } from "../repositories/dataset.repository.js";
import type { DatasetRow } from "@data-cleaning-system/shared";
import type { RetrievedDataset } from "../types/dataset.type.js";
import type { Response } from "express";

async function saveCleanedDatasetService(res: Response, datasetId: string, dataset: RetrievedDataset, rows: DatasetRow[]) {
    const client = await pool.connect();
    try {
        const userId = res.locals.user?.userId;
        if (!userId) {
            res.status(404).json({ error: "User not found." });
            return;
        }

        client.query("BEGIN");
        const newDatasetId = randomUUID();

        await persistDataset(
            newDatasetId,
            userId,
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