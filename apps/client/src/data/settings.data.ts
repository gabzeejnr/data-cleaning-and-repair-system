import type { SettingsTheme } from "../types";

const themes: readonly SettingsTheme[] = [
    { value: "light", label: "Light", description: "Always use light mode" },
    { value: "dark", label: "Dark", description: "Always use dark mode" },
    { value: "system", label: "System", description: "Follow device settings" }
];


export { themes }