import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { ApiError, AccessTokenPayload } from "../types/index.js";

function requireAuth(req: Request, res: Response<ApiError<never>>, next: NextFunction) {
    const token = req.cookies?.accessToken;
    if (!token) {
        res.status(401).json({ error: "User authentication is required." });
        return;
    }
    let decoded: JwtPayload | string;
    try {
        decoded = jwt.verify(token, JWT_SECRET)
    } catch {
        res.status(401).json({ error: "Invalid or expired token." })
        return;
    }

    if (typeof decoded === "string" || decoded.purpose !== "access") {
        res.status(401).json({ error: "Invalid or expired token." });
        return
    }

    res.locals.user = decoded as AccessTokenPayload;
    next();
}

export { requireAuth }