import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ThemeContextType } from "../types";

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {

    const THEME = "DATACARE_THEME"
    const [theme, setTheme] = useState<ThemeContextType["theme"]>(() => {
        const SAVED_THEME = localStorage.getItem(THEME) as ThemeContextType["theme"];
        return SAVED_THEME === "light"
            || SAVED_THEME === "dark"
            || SAVED_THEME === "system"
            ? SAVED_THEME
            : "system"
    })

    const toggleTheme: ThemeContextType["toggleTheme"] = (newTheme?: ThemeContextType["theme"]) => {
        setTheme(t => newTheme ?? (t === "light" ? "dark" : "light"))
    }

    useEffect(() => {
        localStorage.setItem(THEME, theme);
        document.documentElement.style.colorScheme = (theme === "system"
            ? "light dark"
            : theme
        )
    }, [theme])

    const value: ThemeContextType = {
        theme,
        setTheme,
        toggleTheme
    };

    return (
        <ThemeContext value={value}>
            {children}
        </ThemeContext>
    )
}


export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used in a ThemeProvider");
    return ctx;

}