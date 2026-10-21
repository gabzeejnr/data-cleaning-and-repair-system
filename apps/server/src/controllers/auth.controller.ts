import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";
import { createUser, hasUser } from "../repositories/authentication.js";
import { hashPassword, verifyPassword, clearTokenCookie, setTokenCookie } from "../helpers/index.js";
import { toUser } from "../utils/user.js";
import type { Request, Response } from "express";
import type { User } from "@data-cleaning-system/shared";
import type { UserRegistrationInput, LoginInput } from "../apis/auth/index.js";
import type { ApiError, ApiSuccess } from "../types/index.js";


async function registerUser(_req: Request, res: Response<ApiError<never> | ApiSuccess<User>>) {
    try {
        const { email, name, password, confirmPassword } = res.locals.validatedBody as UserRegistrationInput;

        const isUser = await hasUser(email);
        if (isUser) {
            res.status(409).json({ error: "Account found under this email. Use another email." })
            return;
        }

        if (password !== confirmPassword) res.status(400).json({ error: "Passwords do not match. Please try again." })

        const hashed = await hashPassword(password)
        const newUser = await createUser(name, email, hashed);

        res.status(201).json({
            message: "User created successfully",
            data: {
                userId: newUser.user_id,
                name,
                email,
                role: newUser.role
            }
        })
    } catch (err) {
        console.log("Could not create user:", err)
        res.status(500).json({
            error: (err instanceof Error
                ? ""
                : "Error creating user"
            )
        })
    }
}

async function loginUser(_req: Request, res: Response<ApiError<never> | ApiSuccess<User>>) {
    const { email, password } = res.locals.validatedBody as LoginInput;

    try {
        const user = await hasUser(email);
        if (!user) {
            res.status(401).json({ error: "Incorrect email or password. Please try again." })
            return;
        }

        const passwordValid = await verifyPassword(email, password);
        if (!passwordValid) {
            res.status(401).json({ error: "Incorrect email or password. Please try again." });
            return;
        }

        const data = toUser(user)

        const token = jwt.sign(
            { ...data, purpose: "access" },
            JWT_SECRET,
            { expiresIn: "1d" }
        )

        setTokenCookie(res, "accessToken", token, 24 * 60 * 60 * 1000);

        res.status(200).json({ message: "Login successful.", data });
    } catch (err) {
        console.log("Could not login user:", err)
        res.status(500).json({ error: "An unexpected error occurred. Please try again." })
    }
}

function logOutUser(_req: Request, res: Response<ApiSuccess<never> | ApiError<never>>) {
    try {
        clearTokenCookie(res, "accessToken");
        res.status(200).json({ message: "User logged out successfully." })
    } catch (err) {
        console.error("Couldn't log out user:", err)
        res.status(500).json({
            error: (err instanceof Error
                ? err.message
                : "Couldn't log user out."
            )
        })
    }
}

export { registerUser, loginUser, logOutUser }