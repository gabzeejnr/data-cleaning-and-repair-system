import { Pool, type QueryResult } from "pg";
import {
    DATABASE, DATABASE_HOST, DATABASE_PASSWORD,
    DATABASE_PORT, DATABASE_USER
} from "./env.js";

const pool = new Pool({
    database: DATABASE,
    user: DATABASE_USER,
    host: DATABASE_HOST,
    port: DATABASE_PORT,
    password: DATABASE_PASSWORD
})

try {
    const { rows }: QueryResult<{ start_time: string }> = await pool.query("SELECT NOW() AS start_time");
    console.log("Database connected successfully\nStart time:", rows[0]?.start_time.toString());
} catch (err) {
    console.error("Database connection failed:", err);
}

export { pool };