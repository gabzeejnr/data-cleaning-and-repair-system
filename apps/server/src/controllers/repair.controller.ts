import { getDataset } from "../repositories/dataset.repository.js";
import { repairMissingValues } from "../services/index.js";
import type { Request, Response } from "express";
import type { ErrorType, Success, MissingValueRepairResult } from "../types/index.js";
import type { RepairMissingValueInput } from "../apis/datasets/repair-missing-values.js";

async function repairMissingValue(req: Request, res: Response<ErrorType<unknown[]> | Success<MissingValueRepairResult>>): Promise<void> {

    try {
        const { datasetId, column, strategy, fillValue } = res.locals.validatedBody as RepairMissingValueInput;

        if (!datasetId || !column || !strategy) {
            res.status(400).json({
                error: "Dataset ID, column and strategy are required."
            })
            return;
        }

        const dataset = await getDataset(datasetId);
        if (!dataset) {
            res.status(404).json({ error: "Dataset not found." });
            return
        }
        const result = repairMissingValues(dataset.rows, { column, strategy, fillValue });

        res.status(200).json({
            message: "Missing values repaired successfully.",
            data: {
                datasetId,
                column: result.column,
                strategy: result.strategy,
                replacementValue: result.replacementValue,
                repairedCount: result.repairedCount,
                rows: result.rows
            }
        })
    } catch (err) {
        res.status(400).json({
            error: (err instanceof Error
                ? err.message
                : "Failed to repair missing values."
            )
        })
    }
}

export { repairMissingValue }