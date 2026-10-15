import type { Error } from "../types/global.types.js";

const ServerError: Error<never> = { error: "Internal server error. please try again" };

export { ServerError }
