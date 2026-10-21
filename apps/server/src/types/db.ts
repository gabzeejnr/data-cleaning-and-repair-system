import type { UserRole } from "@data-cleaning-system/shared"

interface UserRow {
    user_id: string;
    name: string;
    email: string;
    role: UserRole;
    password?: string
}

export type { UserRow }