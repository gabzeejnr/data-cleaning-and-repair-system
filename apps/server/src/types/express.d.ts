declare global {
    namespace Express {
        interface Locals {
            validatedBody?: unknown
        }
    }
}

export { };