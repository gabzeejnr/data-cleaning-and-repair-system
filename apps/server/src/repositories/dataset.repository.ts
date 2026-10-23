import { pool } from "../configs/db.js"
import type { QueryResult } from "pg";
import type { DatasetRow, DatabaseDataset, RetrievedDataset } from "../types/dataset.type.js";
import { randomUUID } from "crypto";

async function createDataset(id: string, filename: string, columns: string[], rowCount: number): Promise<{ id: string }> {
    const { rows }: QueryResult<{ id: string }> = await pool.query(`INSERT INTO datasets(id, filename, columns, row_count, column_count, expires_at)
        VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours') RETURNING id`,
        [id, filename, columns, rowCount, columns.length]
    )

    return rows[0]!
}

async function saveDatasetRows(datasetId: string, rows: DatasetRow[]): Promise<void> {
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const values: unknown[] = [];

        const placeholders = batch.map((row, index) => {
            const offset = index * 3;

            values.push(datasetId, i + index, JSON.stringify(row));

            return `($${offset + 1}, $${offset + 2}, $${offset + 3}::jsonb)`;
        })

        await pool.query(`INSERT INTO dataset_rows (dataset_id, row_index, row_data)
            VALUES ${placeholders.join(", ")}`,
            values
        )
    }
}

async function persistDataset(id: string, userId: string, filename: string, columns: string[], rows: DatasetRow[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `INSERT INTO datasets (id, user_id, filename, columns, row_count,column_count, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')`,
            [id, userId, filename, columns, rows.length, columns.length]
        );

        const batchSize = 500;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const values: unknown[] = [];

            const placeholders = batch.map((row, index) => {
                const offset = index * 3;
                values.push(id, i + index, JSON.stringify(row));

                return `($${offset + 1}, $${offset + 2}, $${offset + 3}::jsonb)`;
            });

            await client.query(
                `INSERT INTO dataset_rows (dataset_id, row_index, row_data)
                 VALUES ${placeholders.join(", ")}`,
                values
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getDataset(id: string): Promise<RetrievedDataset | null> {
    const findDataset: QueryResult<DatabaseDataset> = await pool.query(
        `SELECT * FROM datasets WHERE id = $1`,
        [id]
    )

    if (findDataset.rows.length <= 0) return null

    const res = await pool.query<{ row_data: DatasetRow }>(
        `SELECT row_data FROM dataset_rows WHERE dataset_id = $1 ORDER BY row_index ASC`,
        [id]
    )

    const rows = res.rows.map(row => row.row_data);
    const dataset = findDataset.rows[0]!

    return {
        id: dataset.id,
        file: dataset.filename,
        columns: dataset.columns,
        rows,
        expires_at: dataset.expires_at
    }
}

async function saveCleanedDatasetService(datasetId: string, userId: string, dataset: RetrievedDataset, rows: DatasetRow[]) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const newDatasetId = randomUUID();

        await persistDataset(
            newDatasetId,
            userId,
            `${datasetId}-${dataset.file}-cleaned`,
            dataset.columns,
            rows
        )

        await client.query(
            `INSERT INTO repair_history(original_dataset_id, cleaned_dataset_id, )`
        )

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release()
    }
}

async function getDatasetsFunc(args: { userId: string; datasetId: string; limit?: string }): Promise<DatabaseDataset | null>;
async function getDatasetsFunc(args: { userId: string; limit?: string; datasetId?: undefined }):Promise<DatabaseDataset[] | null>;
async function getDatasetsFunc({ userId, limit, datasetId }: { userId: string, limit?: string, datasetId?: string }): Promise<DatabaseDataset[] | DatabaseDataset | null> {
    const queries: string[] = ["user_id = $1"];
    const values: unknown[] = [userId];

    if (datasetId) {
        values.push(datasetId);
        queries.push(`id = $${values.length}`)
    }

    let sql = `SELECT id, filename, row_count, column_count, created_at, expires_at, status FROM datasets WHERE ${queries.join(" AND ")} AND expires_at > NOW() ORDER BY created_at DESC`

    if (limit) {
        values.push(Number(limit));
        sql += ` LIMIT $${values.length}`;
    }

    const { rows } = await pool.query<DatabaseDataset>(sql, values)
    if (datasetId) {
        return rows[0] ?? null
    }

    return rows
}


async function getDatasetRows(datasetId: string, limit?: number): Promise<DatasetRow[]> {
    const values: unknown[] = [datasetId];
    let sql = `SELECT row_data FROM dataset_rows WHERE dataset_id = $1 ORDER BY id ASC`
    if (limit) {
        values.push(limit);
        sql += ` LIMIT $${values.length}`;
    }

    const { rows } = await pool.query<{ row_data: unknown }>(sql, values)

    return rows;
}


export { createDataset, saveDatasetRows, persistDataset, getDataset, getDatasetsFunc, getDatasetRows }