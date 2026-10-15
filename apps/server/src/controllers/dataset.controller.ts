import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import path from "node:path"
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ServerError, MAX_ROWS } from "../libs/controller.lib.js";
import type { ErrorRequestHandler, Request, Response } from "express";
import type { ErrorType, Success } from "../types/global.types.js";
import type { DatasetRow, CSVErrorDetail, UploadSuccess } from "../types/dataset.type.js";
import { MulterError } from "multer";

function uploadFile(req: Request, res: Response<ErrorType<CSVErrorDetail> | Success<UploadSuccess>>): void {
    try {
        if (!req.file) {
            res.status(400).json({
                error: "please upload a CSV or XLSX file using the 'file' field."
            });
            return;
        }

        const extension = path.extname(req.file.originalname).toLowerCase();
        let rows: DatasetRow[] = [];

        if (extension === ".csv") {
            const csv = req.file.buffer.toString("utf-8");

            const result = Papa.parse<DatasetRow>(csv, {
                header: true,
                skipEmptyLines: "greedy",
                transformHeader: (header) => header.trim()
            })

            if (result.errors.length > 0) {
                res.status(400).json({
                    error: "The CSV contains parsing errors.",
                    details: result.errors.slice(0, 10).map((error) => ({
                        message: error.message,
                        row: error.row,
                    })),
                });
                return;
            }

            rows = result.data;
        } else {
            const workbook = XLSX.read(req.file.buffer, {
                type: "buffer",
                sheets: undefined,
            });

            const firstSheetName = workbook.SheetNames[0];

            if (!firstSheetName) {
                res.status(400).json({
                    error: "The Excel workbook contains no worksheets.",
                });
                return;
            }

            const worksheet = workbook.Sheets[firstSheetName];

            if (!worksheet) {
                res.status(400).json({
                    error: "Could not read the first worksheet.",
                });
                return;
            }

            rows = XLSX.utils.sheet_to_json<DatasetRow>(worksheet, {
                defval: null,
                raw: false,
            });
        }

        if (rows.length === 0) {
            res.status(400).json({
                error: "The uploaded dataset contains no data rows.",
            });
            return;
        }
        if (rows.length > MAX_ROWS) {
            res.status(413).json({
                error: `The dataset exceeds the ${MAX_ROWS.toLocaleString()} row limit.`,
            });
            return;
        }

        const columns = Object.keys(rows[0] ?? {});
        if (columns.length === 0 || columns.some((column) => !column)) {
            res.status(400).json({
                error: "The dataset must have valid column headers.",
            });
            return;
        }

        res.status(200).json({
            message: "Dataset uploaded and parsed successfully.",
            data: {
                filename: req.file.originalname,
                rowCount: rows.length,
                columnCount: columns.length,
                columns,
                preview: rows.slice(0, 10),
            },
        });
    } catch (err) {
        res.status(400).json({
            error: "Could not parse the uploaded file. Check that it is a valid CSV or XLSX file.",
        });
    }
}

function uploadMiddleware(error: Error & { code?: string },
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (error instanceof MulterError) {
        res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
            error: (error.code === "LIMIT_FILE_SIZE"
                ? "File exceeds the 10 MB upload limit."
                : error.message
            )
        });
        return;
    }

    res.status(400).json({ error: error.message });
}

export { uploadFile, uploadMiddleware }