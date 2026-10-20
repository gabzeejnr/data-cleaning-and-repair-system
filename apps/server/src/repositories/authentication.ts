import { pool } from "../configs/db.js";
import type { User } from "../types/index.js";


async function createUser(name: string, email: string, password: string): Promise<User> {
    const { rows } = await pool.query<User>(`INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3) RETURNING user_id, name, email, role`,
        [name, email, password]
    )

    return rows[0]!;
}


interface HasUserOptions {
    password?: boolean
}


async function hasUser(email: string, options?: HasUserOptions): Promise<User | null> {

    const columns = (options?.password
        ? "user_id, name, email, role, password"
        : "user_id, name, email, role"
    )

    const { rows } = await pool.query<User>(`SELECT ${columns} FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) return null;
    return rows[0] ?? null;
}


export { createUser, hasUser }