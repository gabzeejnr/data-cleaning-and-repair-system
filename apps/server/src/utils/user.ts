import type { User } from "@data-cleaning-system/shared"
import type { UserRow } from "../types/db.js"

const toUser = (user: UserRow): User => ({
    userId: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role
})

export { toUser }