import type { AccessTokenPayload } from "@data-cleaning-system/shared";

declare global {
    namespace Express {
        interface Locals {
            validatedBody?: unknown,
            user?: AccessTokenPayload
        }
    }
}

export { };