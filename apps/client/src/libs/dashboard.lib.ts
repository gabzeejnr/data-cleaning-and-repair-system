import type { StatCardProps } from "../types";
type Accent = NonNullable<StatCardProps["accent"]>;

const accents = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
}

const theme: Record<Accent, { tile: string; glow: string; bar: string }> = {
    indigo: {
        tile: `bg-gradient-to-br from-indigo-50 to-indigo-200 ${accents["indigo"]} shadow-indigo-500/30`,
        glow: "bg-indigo-400",
        bar: "bg-gradient-to-r from-indigo-500 to-violet-500",
    },
    amber: {
        tile: `bg-gradient-to-br from-amber-50 to-amber-200 ${accents["amber"]} shadow-amber-500/30`,
        glow: "bg-amber-400",
        bar: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    emerald: {
        tile: `bg-gradient-to-br from-emerald-50 to-emerald-200 ${accents["emerald"]} shadow-emerald-500/30`,
        glow: "bg-emerald-400",
        bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    rose: {
        tile: `bg-gradient-to-br from-rose-50 to-rose-200 ${accents["rose"]} shadow-rose-500/30`,
        glow: "bg-rose-400",
        bar: "bg-gradient-to-r from-rose-500 to-pink-500",
    },
};

export { accents, theme }