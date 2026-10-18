import { z } from "zod"

export const userLoginZod = z.object({
    email: z.string().min(5),
    password: z.string().min(8)
})

export type LoginInput = z.infer<typeof userLoginZod>