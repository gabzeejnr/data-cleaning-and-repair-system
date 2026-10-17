import { detectDuplicateSchema } from "../api/datasets/detect-duplicate.js";
import type { Request, Response, NextFunction } from "express";

function validateSchema(req: Request, res: Response, next: NextFunction) {
    const result = detectDuplicateSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            error: "Invalid request data.",
            details: result.error.issues
        })

        return;
    }

    next();
}

export { validateSchema }