import { pool } from "../configs/db.js";
import type { QueryResult } from "pg";
import type { User } from "../types/index.js";


async function createUser(name: string, email: string, password: string): Promise<User> {
    const { rows }: QueryResult<User> = await pool.query(`INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3) RETURNING user_id, name, email, role`,
        [name, email, password]
    )

    return rows[0]!;
}


interface WithPassword extends User {
    password: string
}

async function hasUser(email: string, options?: { password: true }): Promise<WithPassword | null>;
async function hasUser(email: string, options?: { password: false }): Promise<User | null>;
async function hasUser(email: string, options?: { password?: boolean }): Promise<User | null> {
    let user: WithPassword;

    const { rows }: QueryResult<WithPassword> = await pool.query(`SELECT user_id, name, email, password, role FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) return null;
    user = rows[0]!

    if (options?.password) {
        return user;
    }

    const { name, password, role, user_id } = user

    return {
        name,
        user_id: user.user_id,
        email,
        role
    }
}


export { createUser, hasUser }