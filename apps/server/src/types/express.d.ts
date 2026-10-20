import type { AccessTokenPayload } from "./index.ts";

declare global {
    namespace Express {
        interface Locals {
            validatedBody?: unknown,
            user?: AccessTokenPayload
        }
    }
}

export { };