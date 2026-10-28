import type { User } from "@data-cleaning-system/shared";

interface UserContextType {
    user: User | null
    setUser: (user: User | null) => void;
    loading: boolean,
    initials: string | "U";
    logOut: () => Promise<void>
}

export type { UserContextType }