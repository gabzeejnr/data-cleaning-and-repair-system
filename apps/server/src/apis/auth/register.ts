import { z } from "zod";

export const userRegisterationZod = z.object({
    name: z.string(),
    email: z.string(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
})

export type UserRegistrationInput = z.infer<typeof userRegisterationZod>