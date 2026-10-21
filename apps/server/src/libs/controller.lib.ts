import type { ApiError } from "../types/api.js";

const ServerError: ApiError<never> = { error: "Internal server error. please try again" };
const MAX_ROWS = 50_000;

export { ServerError, MAX_ROWS }
