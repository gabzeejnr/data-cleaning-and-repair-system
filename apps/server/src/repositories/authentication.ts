import { pool } from "../configs/db.js";
import type { UserRow } from "../types/db.js";


async function createUser(name: string, email: string, password: string): Promise<Omit<UserRow, 'password'>> {
    const { rows } = await pool.query<Omit<UserRow, 'password'>>(`INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3) RETURNING user_id, name, email, role`,
        [name, email, password]
    )

    return rows[0]!;
}

async function hasUser(email: string): Promise<Omit<UserRow, 'password'> | null> {

    const { rows } = await pool.query<UserRow>(`SELECT user_id, name, email, role FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) return null;
    return rows[0] ?? null;
}





export { createUser, hasUser }