import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import path from "node:path"
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ServerError } from "../libs/controller.lib.js";
import type { Request, Response } from "express";
import { Error } from "../types/global.types.js";
import { DatasetRow } from "../types/dataset.type.js";

function uploadFile(req: Request, res: Response<Error<(number | undefined)[]>>) {
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
        }


    } catch (err) {
        res.status(500).json(ServerError)
    }
}

export { uploadFile }