import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import { env } from "node:process";

function requireEnv(name: string, env: string | undefined): string {
    if (!env) throw new Error(`${name.toUpperCase().trim()} is required`);
    return env
}

const IS_ACTIVE = requireEnv("STATUS", env.STATUS) === "active";
const DATABASE_URL = requireEnv("DATABASE_URL", env.DATABASE_URL);
const JWT_SECRET = requireEnv("JWT_SECRET", env.JWT_SECRET)

export { IS_ACTIVE, DATABASE_URL, JWT_SECRET }