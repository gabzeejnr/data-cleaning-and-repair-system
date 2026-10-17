import { getDataset } from "../repositories/dataset.repository.js";
import { findDuplicateGroups } from "../services/duplicate-detection.js";
import type { Request, Response } from "express";
import type { ErrorType, Success, DuplicateReturn } from "../types/index.js";

async function detectDuplicates(req: Request, res: Response<ErrorType<any[]> | Success<DuplicateReturn>>) {
    const { datasetId, columns } = req.body;

    if (!datasetId || !Array.isArray(columns) || columns.length === 0) {
        res.status(400).json({
            error: "Dataset ID and at least one column are required."
        })
        return;
    }

    const dataset = await getDataset(datasetId);
    if (!dataset) {
        res.status(404).json({
            error: "Dataset not found or has expired. Please upload it again."
        })
        return
    }

    const invalidColumns = columns.filter(
        (column: unknown) => (
            typeof column !== "string" ||
            !dataset.columns.includes(column)
        )
    )

    if (invalidColumns.length > 0) {
        res.status(400).json({
            error: "One or more selected columns are invalid.",
            details: invalidColumns
        });
        return
    };

    const groups = findDuplicateGroups(dataset.rows, columns);
    res.status(200).json({
        message: "Duplicate detection completed successfully.",
        data: {
            datasetId,
            selectedColumns: columns,
            duplicateGroupCount: groups.length,
            duplicateRowCount: groups.reduce(
                (total, group) => total + group.length,
                0
            ),
            groups
        }
    })
}

export { detectDuplicates }