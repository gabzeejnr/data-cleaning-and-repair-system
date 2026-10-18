import { randomUUID } from "node:crypto";
import { getDataset, persistDataset } from "../repositories/index.js";
import { repairMissingValues } from "../services/index.js";
import type { Request, Response } from "express";
import type { ErrorType, Success, CleanSaveSuccess } from "../types/index.js";
import type { RepairMissingValueInput } from "../apis/datasets/index.js";


async function saveCleanedDataset(_req: Request, res: Response<ErrorType<never> | Success<CleanSaveSuccess>>): Promise<void> {
    const { datasetId, column, strategy, fillValue } = res.locals.validatedBody as RepairMissingValueInput;

    try {
        const dataset = await getDataset(datasetId);
        if (!dataset) {
            res.status(404).json({ error: "Dataset not found." });
            return;
        }

        const result = repairMissingValues(dataset.rows, { column, strategy, fillValue })

        const newDatasetId = randomUUID();

        await persistDataset(
            newDatasetId,
            `${datasetId}-cleaned`,
            dataset.columns,
            result.rows
        )

        res.status(201).json({
            message: "Cleaned dataset saved successfully.",
            data: {
                datasetId: newDatasetId,
                originalDatasetId: datasetId,
                repairedColumn: column,
                repairedCount: result.repairedCount
            }
        })
    } catch (err) {
        res.status(400).json({
            error: (err instanceof Error
                ? err.message
                : "Failed to save cleaned dataset."
            )
        })
    }
}


export { saveCleanedDataset }