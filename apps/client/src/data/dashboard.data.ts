import { API } from "../apis/axios";
import { Database, CircleAlert, WandSparkles, ChartNoAxesCombined } from "../libs";
import type { DashboardSummary } from "@data-cleaning-system/shared";
import type { QuickActionProps, StatCardProps } from "../types";

async function getDashboardSummary(): Promise<DashboardSummary> {
    const { data } = await API.get("/datasets/summary");
    return data.data
}

const getStats = (summary: DashboardSummary): readonly StatCardProps[] => ([
    {
        id: "totalDatasets",
        title: "Total datasets",
        value: summary.totalDatasets,
        icon: Database,
        description: "Datasets uploaded to your workspace",
        accent: "indigo",
    },
    {
        id: "issuesDetected",
        title: "Issues detected",
        value: 138,
        icon: CircleAlert,
        description: "Missing values, duplicates and outliers",
        accent: "amber",
    },
    {
        id: "repairsCompleted",
        title: "Repairs completed",
        value: summary.repairsCompleted,
        icon: WandSparkles,
        description: "Issues repaired across your datasets",
        accent: "emerald",
    },
    {
        id: "avgDataQuality",
        title: "Average data quality",
        value: "94.8%",
        icon: ChartNoAxesCombined,
        description: "Overall quality score across datasets",
        accent: "rose",
    },
])

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

export { getDashboardSummary, getStats, quickActions }