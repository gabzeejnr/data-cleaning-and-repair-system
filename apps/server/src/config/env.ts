import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import { env } from "node:process";

function requireEnv(name: string, env: string | undefined): string {
    if (!env) throw new Error(`${name.toUpperCase().trim()} is required`);
    return env
}

const IS_ACTIVE = requireEnv("STATUS", env.STATUS) === "active";
const DATABASE = requireEnv("database", env.DATABASE);
const DATABASE_PASSWORD = requireEnv("database_password", env.DATABASE_PASSWORD);
const DATABASE_USER = requireEnv("database_user", env.DATABASE_USER);
const DATABASE_HOST = requireEnv("database_host", env.DATABASE_HOST);
const DATABASE_PORT = Number(requireEnv("DATABASE_PORT", env.DATABASE_PORT))

export {
    IS_ACTIVE, DATABASE, DATABASE_PASSWORD,
    DATABASE_USER, DATABASE_HOST, DATABASE_PORT
}