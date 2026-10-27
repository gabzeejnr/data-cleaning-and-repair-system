import { randomUUID } from "node:crypto";
import { getDataset, getDatasetRows, persistRepairedDataset } from "../repositories/index.js";
import type { Request, Response } from "express";
import type { SaveRepairsBody } from "../types/dataset.type.js";
import { countMissingValues } from "../helpers/missingValues.js";

async function saveRepairs(req: Request, res: Response): Promise<void> {
    const { datasetId, records, reports } = req.body as SaveRepairsBody;
    const userId = res.locals.user?.userId as string;

    try {
        if (!userId) {
            res.status(404).json({ error: "User not found." });
            return;
        }

        if (!Array.isArray(records) || records.length === 0) {
            res.status(400).json({ error: "Cleaned records must contain at least one row." });
            return;
        }

        const dataset = await getDataset(datasetId);
        if (!dataset) {
            res.status(404).json({ error: "Dataset not found." });
            return;
        }
        const originalRecords = await getDatasetRows(datasetId)

        if (dataset.userId !== userId) {
            res.status(403).json({ error: "You do not have permission to repair this dataset." });
            return;
        }

        const newDatasetId = randomUUID();
        const missingBefore = countMissingValues(originalRecords);
        const missingAfter = countMissingValues(records);
        await persistRepairedDataset({
            id: newDatasetId,
            originalDatasetId: datasetId,
            userId,
            filename: `${dataset.file}-repaired`,
            columns: dataset.columns,
            reports,
            missing_before: missingBefore,
            missing_after: missingAfter,
            rows: records
        });

        res.status(201).json({
            message: "Repaired dataset saved successfully.",
            data: {
                datasetId: newDatasetId,
                originalDatasetId: datasetId,
                rowCount: records.length,
                columnCount: dataset.columns.length,
                missingBefore,
                missingAfter
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to save repaired dataset.",
        });
    }
}

export { saveRepairs };