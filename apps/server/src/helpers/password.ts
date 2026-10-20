import bcrypt from "bcrypt";
import { pool } from "../configs/db.js";
const saltRounds = 10;


async function hashPassword(password: string):Promise<string> {
    const h = bcrypt.hash(password, saltRounds)
    return h
}

async function verifyPassword(email: string, password: string): Promise<boolean> {

    const { rows } = await pool.query<{ password: string }>(`SELECT * FROM users WHERE email = $1`,
        [email]
    );
    if (rows.length === 0) return false
    return bcrypt.compare(password, rows[0]?.password!)
}

export { hashPassword, verifyPassword }