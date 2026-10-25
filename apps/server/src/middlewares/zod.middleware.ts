import type { ZodType } from "zod";
import type { Request, Response, NextFunction } from "express";

function validateSchema<T>(zod: ZodType<T>) {

    return (req: Request, res: Response, next: NextFunction): void => {

        const result = zod.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                error: "Invalid request data.",
                details: result.error.issues
            })
            return;
        }

        res.locals.validatedBody = result.data;
        next();
    }
}

export { validateSchema }