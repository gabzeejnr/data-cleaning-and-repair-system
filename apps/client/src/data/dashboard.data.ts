import {
    Database,
    CircleAlert,
    WandSparkles,
    ChartNoAxesCombined
} from "../libs";
import type { QuickActionProps, StatCardProps } from "../types";

const stats: readonly StatCardProps[] = [
    {
        title: "Total datasets",
        value: 24,
        icon: Database,
        description: "Datasets uploaded to your workspace",
        accent: "indigo",
    },
    {
        title: "Issues detected",
        value: 138,
        icon: CircleAlert,
        description: "Missing values, duplicates and outliers",
        accent: "amber",
    },
    {
        title: "Repairs completed",
        value: 96,
        icon: WandSparkles,
        description: "Issues repaired across your datasets",
        accent: "emerald",
    },
    {
        title: "Average data quality",
        value: "94.8%",
        icon: ChartNoAxesCombined,
        description: "Overall quality score across datasets",
        accent: "rose",
    },
]

const quickActions: readonly QuickActionProps[] = [
    {
        label: "View datasets",
        description: "Browse uploaded files",
        to: "/datasets",
    },
    {
        label: "Review data issues",
        description: "Inspect detected problems",
        to: "/issues",
    },
    {
        label: "View repair history",
        description: "Track automated repairs",
        to: "/repairs",
    },
]

export { stats, quickActions }