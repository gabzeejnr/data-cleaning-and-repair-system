import type { User } from "@data-cleaning-system/shared";
import type { Dispatch, SetStateAction } from "react";

type Theme = "light" | "dark" | "system";

interface UserContextType {
    user: User | null
    setUser: (user: User | null) => void;
    loading: boolean,
    initials: string | "U";
    logOut: () => Promise<void>
}

interface ThemeContextType {
    theme: Theme;
    setTheme: Dispatch<SetStateAction<Theme>>;
    toggleTheme: (theme?: Theme) => void
}

export type { UserContextType, ThemeContextType }