import type { User } from "@data-cleaning-system/shared"

interface AccessTokenPayload extends Omit<User, 'password'> {
    purpose: "access"
}

export type { AccessTokenPayload }