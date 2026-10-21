import type { User } from "@data-cleaning-system/shared";

interface UserContextType {
    user: User | null
    setUser: (user: User | null) => void;
}

export type { UserContextType }