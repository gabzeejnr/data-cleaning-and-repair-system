import type { Request, Response } from "express";
import { readPDF } from "../services/pdf/pdf.service.js";

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