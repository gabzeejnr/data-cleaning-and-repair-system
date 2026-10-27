import { pool } from "../configs/db.js";
import type { Request, Response } from "express";
import type { ApiError, ApiSuccess } from "../types/api.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function getReports(req: Request, res: Response<ApiSuccess | ApiError>) {
    const userId = res.locals.user?.userId;

    if (!userId) {
        res.status(401).json({ error: "Couldn't find user. Please try again." });
        return;
    }

    const rawLimit = req.query.limit;
    const parsedLimit =
        typeof rawLimit === "string" ? Number(rawLimit) : DEFAULT_LIMIT;

    if (!Number.isInteger(parsedLimit)
        || parsedLimit < 1
        || parsedLimit > MAX_LIMIT
    ) {
        res.status(400).json({ error: `Limit must be an integer between 1 and ${MAX_LIMIT}.` });
        return;
    }

    try {

        const { rows } = await pool.query(`WITH report_runs AS (SELECT cr.repaired_dataset_id, MIN(cr.dataset_id::text)::uuid AS dataset_id
            FROM cleaning_reports cr JOIN datasets repaired ON repaired.id = cr.repaired_dataset_id
            WHERE repaired.user_id = $1 GROUP BY cr.repaired_dataset_id),
            reports AS (SELECT repaired.id, original.id AS dataset_id,
            original.filename AS dataset_name, repaired.created_at,
            original.row_count AS rows_before, repaired.row_count AS rows_after,
            repaired.missing_before AS missing_before, repaired.missing_after AS missing_after,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('errorType', cr.error_type,
            'recordsAffected', cr.records_affected, 'actionTaken', cr.action_taken)
            ORDER BY cr.date_cleaned, cr.log_id) FROM cleaning_reports cr
            WHERE cr.repaired_dataset_id = repaired.id), '[]'::jsonb) AS breakdown
            FROM report_runs rr JOIN datasets repaired ON repaired.id = rr.repaired_dataset_id
            JOIN datasets original ON original.id = rr.dataset_id WHERE repaired.user_id = $1)
            SELECT * FROM reports ORDER BY created_at DESC, id DESC LIMIT $2`,
            [userId, parsedLimit]
        )

        const reportRows = rows.slice(0, parsedLimit);

        const data = reportRows.map(row => ({
            id: row.id,
            datasetId: row.dataset_id,
            datasetName: row.dataset_name,
            createdAt: row.created_at,
            rowsBefore: Number(row.rows_before),
            rowsAfter: Number(row.rows_after),
            missingBefore: Number(row.missing_before),
            missingAfter: Number(row.missing_after),
            breakdown: row.breakdown ?? [],
        }))

        res.status(200).json({
            message: "Report generation successful",
            data
        })
    } catch (err) {
        console.error("Failed to fetch reports:", err);
        res.status(500).json({ error: "Failed to fetch cleaning reports." });
    }
}