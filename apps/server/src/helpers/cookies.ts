import { env } from "node:process";
import type { Response } from "express";
const secure = env.NODE_ENV === "production"

function setTokenCookie(
    res: Response,
    tokenName: string,
    token: string,
    maxAge?: number
) {
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure,
        sameSite: "none",
        maxAge
    })
}

function clearTokenCookie(res: Response, tokenName: string) {
    res.clearCookie(tokenName, {
        httpOnly: true,
        secure,
        sameSite: "none"
    })
}


export { setTokenCookie, clearTokenCookie }