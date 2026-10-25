import { randomUUID } from "node:crypto";
import path from "node:path"
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { detectIssues, profileDataset } from "../services/index.js";;
import { MAX_ROWS } from "../libs/controller.lib.js";
import { getDatasetProfile, getDatasetRows, getDatasetsFunc, persistDataset } from "../repositories/index.js";
import { toDataset } from "../utils/datasets.js";
import type { Request, Response } from "express";
import type { Dataset, DataIssue, DatasetRow, getDatasetIdResponse } from "@data-cleaning-system/shared";
import type { ApiError, ApiSuccess, CSVErrorDetail, UploadSuccess } from "../types/index.js";
import { pool } from "../configs/db.js";

async function uploadFile(req: Request, res: Response<ApiError<CSVErrorDetail> | ApiSuccess<UploadSuccess>>): Promise<void> {
    try {

        if (!req.file) {
            res.status(400).json({
                error: "Please upload a CSV or XLSX file using the 'file' field."
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

        const datasetId = randomUUID();
        const userId = res.locals.user?.userId;

        if (!userId) {
            res.status(401).json({
                error: "User not found"
            });
            return;
        }

        const profile = profileDataset(rows);
        await persistDataset(datasetId, userId, req.file.originalname, columns, rows, profile);

        res.status(200).json({
            message: "Dataset uploaded and parsed successfully.",
            data: { datasetId }
        });
    } catch (err) {
        console.error("Dataset upload failed:", err)
        res.status(500).json({
            error: "Dataset upload failed.",
        });
    }
}

async function getDatasets(req: Request<{}, {}, { limit?: string }>, res: Response<ApiError | ApiSuccess<Dataset[]>>) {
    try {
        const userId = res.locals.user?.userId
        if (!userId) {
            res.status(401).json({
                error: "Couldn't find user. Please try again."
            });
            return;
        }

        const { limit } = req.query;

        if (limit !== undefined) {
            if (typeof limit !== "string"
                || !/^[1-9]\d*$/.test(limit)
                || !Number.isSafeInteger(Number(limit))
            ) {
                res.status(400).json({ error: "Invalid dataset limit." });
                return;
            }
        }

        const datasets = await getDatasetsFunc({
            userId,
            limit: typeof limit === "string" ? limit : undefined
        });
        if (!datasets) {
            res.status(404).json({ error: "Dataset not found or expired." })
        }

        const data = toDataset(datasets!);
        if (!Array.isArray(data)) {
            res.status(400).json({
                error: "Something went wrong. Please try again."
            });
            return;
        }


        res.status(200).json({
            message: "Datasets request successful.",
            data
        })
    } catch (err) {
        console.error("Datasets fetching failed:", err)
        res.status(500).json({
            error: "Failed to fetch datasets.Please try again.",
        });
    }
}

async function getDatasetsId(req: Request<{ id: string }>, res: Response<ApiSuccess<getDatasetIdResponse> | ApiError>) {
    try {
        const userId = res.locals.user?.userId;
        if (!userId) {
            res.status(401).json({
                error: "Couldn't find user. Please try again."
            });
            return;
        }

        const { id } = req.params;
        if (typeof id !== "string" || !id.trim()) {
            res.status(400).json({ error: "Invalid request parameter." });
            return;
        }

        const datasetData = await getDatasetsFunc({ userId, datasetId: id })
        if (!datasetData) {
            res.status(404).json({ error: "Dataset not found or expired." });
            return;
        }
        const rowsData = await getDatasetRows(id, 10);
        const dataset = toDataset(datasetData) as Dataset;
        const rows = rowsData.map(row => row.row_data) as DatasetRow[];
        const profile = await getDatasetProfile(dataset.id);

        res.status(200).json({
            message: "Dataset request successful.",
            data: { dataset, rows, profile }
        })
    } catch (err) {
        console.error("Failed to fetch dataset:", err);
        res.status(500).json({
            error: "Failed to retrieve dataset.",
        });
    }
}

async function getDatasetIdRows(req: Request<{ id: string }>, res: Response<ApiSuccess | ApiError>) {
    try {
        const userId = res.locals.user?.userId;
        if (!userId) {
            res.status(401).json({
                error: "Couldn't find user. Please try again."
            });
            return;
        }

        const { id } = req.params;
        if (typeof id !== "string" || !id.trim()) {
            res.status(400).json({ error: "Invalid request parameter." });
            return;
        }

        const datasetData = await getDatasetsFunc({ userId, datasetId: id })
        if (!datasetData) {
            res.status(404).json({ error: "Dataset not found or expired." });
            return;
        }

        const { rows: data } = await pool.query(`SELECT * FROM dataset_rows WHERE dataset_id = $1`,
            [datasetData.id]
        )

        res.status(200).json({
            message: "Dataset rows request successful.",
            data
        })
    } catch (err) {
        console.error("Failed to fetch dataset rows:", err);
        res.status(500).json({
            error: "Failed to retrieve dataset rows.",
        });
    }
}

async function getDatasetIssues(req: Request<{ id: string }>, res: Response<ApiSuccess<DataIssue[]> | ApiError>) {
    try {
        const userId = res.locals.user?.userId;
        if (!userId) {
            res.status(401).json({ error: "Couldn't find user. Please try again." });
            return;
        }

        const { id } = req.params;
        if (typeof id !== "string" || !id.trim()) {
            res.status(400).json({ error: "Invalid request parameter." });
            return;
        }

        const dataset = await getDatasetsFunc({ userId, datasetId: id });
        if (!dataset) {
            res.status(404).json({ error: "Dataset not found or expired." });
            return;
        }

        const profile = await getDatasetProfile(id);
        if (!profile) {
            res.status(404).json({ error: "Dataset profile not found." });
            return;
        }

        const issues = detectIssues(id, profile);
        res.status(200).json({
            message: "Dataset issues retrieved successfully.",
            data: issues
        })

    } catch (err) {
        console.error("Failed to fetch dataset issues:", err);
        res.status(500).json({ error: "Failed to retrieve dataset issues." })
    }
}

export {
    getDatasetIssues, getDatasets,
    getDatasetsId, getDatasetIdRows, uploadFile
}