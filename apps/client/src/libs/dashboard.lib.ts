import type { StatCardProps } from "../types";
type Accent = NonNullable<StatCardProps["accent"]>;

const theme: Record<Accent, { tile: string; glow: string; bar: string }> = {
    indigo: {
        tile: "bg-brand-soft text-brand shadow-indigo-500/30",
        glow: "bg-brand",
        bar: "bg-brand",
    },
    amber: {
        tile: "bg-warning/10 text-warning shadow-amber-500/30",
        glow: "bg-warning",
        bar: "bg-warning",
    },
    emerald: {
        tile: "bg-success/10 text-success shadow-emerald-500/30",
        glow: "bg-success",
        bar: "bg-success",
    },
    rose: {
        tile: "bg-danger/10 text-danger shadow-rose-500/30",
        glow: "bg-danger",
        bar: "bg-danger",
    },
};

export { theme }