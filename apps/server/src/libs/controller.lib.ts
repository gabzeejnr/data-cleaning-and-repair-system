import type { ErrorType } from "../types/global.types.js";

const ServerError: ErrorType<never> = { error: "Internal server error. please try again" };
const MAX_ROWS = 50_000;

export { ServerError, MAX_ROWS }
