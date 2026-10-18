import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";
import { createUser, hasUser } from "../repositories/authentication.js";
import { hashPassword, verifyPassword } from "../helpers/password.js";
import type { Request, Response } from "express";
import type { UserRegistrationInput, LoginInput } from "../apis/auth/index.js";
import type { ErrorType, Login, Success, UserCreated } from "../types/index.js";


async function registerUser(_req: Request, res: Response<ErrorType<never> | Success<UserCreated>>) {
    try {
        const { email, name, password } = res.locals.validatedBody as UserRegistrationInput;

        if (!email || !name || !password) {
            res.status(400).json({ error: "username, email and password are required." });
            return;
        }

        const isUser = await hasUser(email);
        if (isUser) {
            res.status(401).json({ error: "Account found under this email. Use another email." })
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
        if (!email) {
            res.status(404).json({ error: "Email is required." });
            return;
        }

        const checkUser = await hasUser(email, { password: true });
        if (!checkUser) {
            res.status(404).json({ error: "User not found for this email. Please try again." })
            return;
        }

        const decoded = await verifyPassword(password, checkUser.password)
        if (!decoded) {
            res.status(401).json({ error: "Incorrect password. Please try again." });
            return;
        }

        const purpose = "access"
        const data = {
            userId: checkUser.user_id,
            name: checkUser.name,
            email: checkUser.email,
            role: checkUser.role
        }

        const token = jwt.sign(
            {
                ...data,
                purpose
            },
            JWT_SECRET,
            { expiresIn: "10m" }
        )

        res.status(200).json({
            message: "Login successful.",
            data
        });
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

export { registerUser, loginUser }