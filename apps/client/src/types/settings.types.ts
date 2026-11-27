import type { ThemeContextType } from "./context.types";

interface SettingsTheme {
    value: ThemeContextType["theme"];
    label: "Light" | "Dark" | "System";
    description: string;
}


export type { SettingsTheme }