import * as XLSX from "xlsx";
import { getDataset, getDatasetRows } from "../repositories/dataset.repository.js";
import { escapeCSV } from "../helpers/files.js";
import type { Request, Response } from "express";
import type { ApiError } from "../types/api.js";

async function downloadDataset(req: Request<{ id: string }, {}, {}, { format: "csv" | "xlsx" }>, res: Response<string | Buffer | ApiError>) {
    const userId = res.locals.user?.userId;
    const { id } = req.params;
    const { format } = req.query;
    try {
        console.log("STARTING...")
        if (!userId) {
            res.status(401).json({ error: "Authentication is required." });
            return
        }

        if (format !== "csv" && format !== "xlsx" ) {
            res.status(422).json({ error: "Invalid download format. Accepted formats are csv and xlsx" })
            return;
        }

        const dataset = await getDataset(id);
        if (!dataset || dataset.userId !== userId) {
            res.status(404).json({ error: "Dataset not found with this id" });
            return;
        }

        const rows = await getDatasetRows(id);
        if (rows.length === 0) {
            res.status(422).json({ error: "This dataset has no rows to download" });
            return;
        }
        const records = rows.map(row => row.row_data as Record<string, unknown>);

        let data: string | Buffer = "";
        console.log(format)
        if (format === "csv") {
            const headers = dataset.columns;

            const csvRows: string[] = [];
            csvRows.push(headers.map(escapeCSV).join(","));

            for (const obj of records) {
                csvRows.push(headers.map(h => escapeCSV(obj[h])).join(","))
            }

            data = csvRows.join('\r\n');

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="${dataset.file}.csv"`)
        } else {
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(records);
            console.log(worksheet)

            XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Data")

            const buffer: Buffer = XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx"
            })

            console.log("buffer size:", buffer.length, typeof buffer)

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="${dataset.file}.xlsx"`)

            data = buffer
        }

        res.status(200).send(data)
    } catch (err) {

    }
}


export { downloadDataset }