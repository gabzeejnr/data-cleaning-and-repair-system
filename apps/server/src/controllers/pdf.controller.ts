import { randomUUID } from "node:crypto";
import path from "node:path";
import { readPDF, extractTables } from "../services/pdf/pdf.service.js";
import { profileDataset } from "../services/index.js";
import { persistDataset } from "../repositories/index.js";
import { MAX_ROWS } from "../libs/controller.lib.js";
import { tableToRecords } from "../helpers/pdf.js";
import type { Request, Response } from "express";

export async function readPdfController(req: Request, res: Response) {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
    }
    try {
        res.json(await readPDF(req.file.buffer));
    } catch (err) {
        res.status(422).json({
            error: err instanceof Error ? err.message : "Could not read PDF.",
        });
    }
}

export async function uploadPdfController(req: Request, res: Response): Promise<void> {
    if (!req.file) {
        res.status(400).json({ error: "Please upload a PDF file using the 'file' field." });
        return;
    }

    const userId = res.locals.user?.userId;
    if (!userId) {
        res.status(401).json({ error: "User not found" });
        return;
    }

    let tables;
    try {
        tables = await extractTables(req.file.buffer);
    } catch (error) {
        res.status(422).json({
            error: error instanceof Error ? error.message : "Could not read PDF.",
        });
        return;
    }

    const datasets = (tables
        .map(tableToRecords)
        .filter(dataset => dataset.rows.length > 0)
    )

    if (datasets.length === 0) {
        res.status(400).json({ error: "No tables with data rows were found in this PDF." });
        return;
    }

    if (datasets.some(dataset => dataset.rows.length > MAX_ROWS)) {
        res.status(413).json({
            error: `A table in this PDF exceeds the ${MAX_ROWS.toLocaleString()} row limit.`,
        });
        return;
    }

    try {
        const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
        const datasetIds: string[] = [];

        for (const [index, dataset] of datasets.entries()) {
            const datasetId = randomUUID();
            const profile = profileDataset(dataset.rows);

            await persistDataset(
                datasetId,
                userId,
                `${baseName}-table-${index + 1}.csv`,
                dataset.columns,
                dataset.rows,
                profile
            );
            datasetIds.push(datasetId);
        }

        res.status(200).json({
            message: `Extracted ${datasetIds.length} table(s) from the PDF.`,
            data: { datasetIds },
        });
    } catch (err) {
        console.error("PDF dataset upload failed:", err);
        res.status(500).json({ error: "PDF dataset upload failed." });
    }
}