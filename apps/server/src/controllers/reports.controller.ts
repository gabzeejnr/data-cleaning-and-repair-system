import { pool } from "../configs/db.js";
import type { Request, Response } from "express";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface ReportCursor {
    createdAt: string;
    id: string;
}

function encodeCursor(cursor: ReportCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value: string): ReportCursor {
    const parsed: unknown = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8")
    )

    if (typeof parsed !== "object"
        || parsed === null
        || !("createdAt" in parsed)
        || !("id" in parsed)
        || typeof parsed.createdAt !== "string"
        || typeof parsed.id !== "string"
        || Number.isNaN(Date.parse(parsed.createdAt))
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id)
    ) {
        throw new Error("Invalid report cursor.");
    }

    return {
        createdAt: parsed.createdAt,
        id: parsed.id,
    };
}

export async function getReports(req: Request, res: Response) {
    const userId = res.locals.user?.userId;

    if (!userId) {
        res.status(401).json({
            error: "Couldn't find user. Please try again.",
        });
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

    let cursor: ReportCursor | null = null;

    if (req.query.cursor !== undefined) {
        if (typeof req.query.cursor !== "string") {
            res.status(400).json({ error: "Invalid report cursor." });
            return;
        }

        try {
            cursor = decodeCursor(req.query.cursor);
        } catch {
            res.status(400).json({ error: "Invalid report cursor." });
            return;
        }
    }

    try {
        const { rows } = await pool.query(
            `
            WITH report_runs AS (
                SELECT
                    cr.repaired_dataset_id,
                    MIN(cr.dataset_id::text)::uuid AS dataset_id
                FROM cleaning_reports cr
                JOIN datasets repaired
                    ON repaired.id = cr.repaired_dataset_id
                WHERE repaired.user_id = $1
                GROUP BY cr.repaired_dataset_id
            ),
            reports AS (
                SELECT
                    repaired.id,
                    original.id AS dataset_id,
                    original.filename AS dataset_name,
                    repaired.created_at,
                    original.row_count AS rows_before,
                    repaired.row_count AS rows_after,
                    NULL::integer AS missing_before,
                    NULL::integer AS missing_after,
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'errorType', cr.error_type,
                                    'recordsAffected', cr.records_affected,
                                    'actionTaken', cr.action_taken
                                )
                                ORDER BY cr.date_cleaned, cr.log_id
                            )
                            FROM cleaning_reports cr
                            WHERE cr.repaired_dataset_id = repaired.id
                        ),
                        '[]'::jsonb
                    ) AS breakdown
                FROM report_runs rr
                JOIN datasets repaired
                    ON repaired.id = rr.repaired_dataset_id
                JOIN datasets original
                    ON original.id = rr.dataset_id
                WHERE repaired.user_id = $1
            )
            SELECT *
            FROM reports
            WHERE (
                $2::timestamptz IS NULL
                OR (created_at, id) < ($2::timestamptz, $3::uuid)
            )
            ORDER BY created_at DESC, id DESC
            LIMIT $4
            `,
            [
                userId,
                cursor?.createdAt ?? null,
                cursor?.id ?? null,
                parsedLimit + 1,
            ]
        );

        const hasMore = rows.length > parsedLimit;
        const reportRows = rows.slice(0, parsedLimit);
        const lastReport = reportRows.at(-1);

        const data = reportRows.map((row) => ({
            id: row.id,
            datasetId: row.dataset_id,
            datasetName: row.dataset_name,
            createdAt: row.created_at,
            rowsBefore: row.rows_before,
            rowsAfter: row.rows_after,
            missingBefore: row.missing_before,
            missingAfter: row.missing_after,
            breakdown: row.breakdown,
        }));

        res.status(200).json({
            data,
            meta: {
                nextCursor:
                    hasMore && lastReport
                        ? encodeCursor({
                            createdAt: new Date(
                                lastReport.created_at
                            ).toISOString(),
                            id: lastReport.id,
                        })
                        : null,
            },
        });
    } catch (err) {
        console.error("Failed to fetch reports:", err);

        res.status(500).json({
            error: "Failed to fetch cleaning reports.",
        });
    }
}
