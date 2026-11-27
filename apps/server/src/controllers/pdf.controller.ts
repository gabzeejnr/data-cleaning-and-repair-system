import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Request, Response } from "express";
import { readPDF, extractTables } from "../services/pdf/pdf.service.js";
import { profileDataset } from "../services/index.js";
import { persistDataset } from "../repositories/index.js";
import { MAX_ROWS } from "../libs/controller.lib.js";
import { tableToRecords } from "../helpers/pdf.js";

export async function readPdfController(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }
    try {
        res.json(await readPDF(req.file.buffer));
    } catch (error) {
        res.status(422).json({
            error: error instanceof Error ? error.message : "Could not read PDF.",
        });
    }
}

export async function uploadPdfController(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({ error: "Please upload a PDF file using the 'file' field." });
    }

    const userId = res.locals.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "User not found" });
    }

    let tables;
    try {
        tables = await extractTables(req.file.buffer);
    } catch (error) {
        return res.status(422).json({
            error: error instanceof Error ? error.message : "Could not read PDF.",
        });
    }

    const datasets = tables
        .map(tableToRecords)
        .filter(dataset => dataset.rows.length > 0);

    if (datasets.length === 0) {
        return res.status(400).json({ error: "No tables with data rows were found in this PDF." });
    }

    if (datasets.some(dataset => dataset.rows.length > MAX_ROWS)) {
        return res.status(413).json({
            error: `A table in this PDF exceeds the ${MAX_ROWS.toLocaleString()} row limit.`,
        });
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
    } catch (error) {
        console.error("PDF dataset upload failed:", error);
        res.status(500).json({ error: "PDF dataset upload failed." });
    }
}