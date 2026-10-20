import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";
import { createUser, hasUser } from "../repositories/authentication.js";
import { hashPassword, verifyPassword, clearTokenCookie, setTokenCookie } from "../helpers/index.js";
import type { Request, Response } from "express";
import type { UserRegistrationInput, LoginInput } from "../apis/auth/index.js";
import type { ErrorType, Login, Success, UserCreated } from "../types/index.js";


async function registerUser(_req: Request, res: Response<ErrorType<never> | Success<UserCreated>>) {
    try {
        const { email, name, password } = res.locals.validatedBody as UserRegistrationInput;

        const isUser = await hasUser(email);
        if (isUser) {
            res.status(409).json({ error: "Account found under this email. Use another email." })
            return;
        }

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
                ? err.message
                : "Error creating user"
            )
        })
    }
}

async function loginUser(_req: Request, res: Response<ErrorType<never> | Success<Login>>) {
    const { email, password } = res.locals.validatedBody as LoginInput;

    try {
        const checkUser = await hasUser(email);
        if (!checkUser) {
            res.status(401).json({ error: "Incorrect email or password. Please try again." })
            return;
        }

        const decoded = await verifyPassword(email, password);
        if (!decoded) {
            res.status(401).json({ error: "Incorrect email or password. Please try again." });
            return;
        }

        const data = {
            userId: checkUser.user_id,
            name: checkUser.name,
            email: checkUser.email,
            role: checkUser.role
        }

        const token = jwt.sign(
            {
                ...data,
                purpose: "access"
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        )
        console.log(token)

        setTokenCookie(res, "accessToken", token, 10 * 60 * 1000);

        res.status(200).json({ message: "Login successful.", data });
    } catch (err) {
        console.log("Could not login user:", err)
        res.status(500).json({
            error: (err instanceof Error
                ? err.message
                : "Error logging user in."
            )
        })
    }
}

function logOutUser(_req: Request, res: Response<Success<never> | ErrorType<never>>) {
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