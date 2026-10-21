import { CircleAlert, Database, FileChartColumn, LayoutDashboard, Settings, WandSparkles } from "../libs"
import type { PagesType } from "../types";

const workspaces: PagesType[] = [
    {
        label: "Overview",
        path: "/dashboard",
        icon: LayoutDashboard,
        end: true,
        text: "Manage and monitor your data quality"
    },
    {
        label: "Datasets",
        path: "/datasets",
        icon: Database,
        text: ""
    },
    {
        label: "Data Issues",
        path: "/issues",
        icon: CircleAlert,
        text: ""
    },
    {
        label: "ML Repairs",
        path: "/repairs",
        icon: WandSparkles,
        text: ""
    },
    {
        label: "Reports",
        path: "/reports",
        icon: FileChartColumn,
        text: ""
    },
]

const preferences: PagesType[] = [
    {
        icon: Settings,
        label: "Settings",
        path: "/settings",
        text: ""
    }
]

const allPages: PagesType[] = [...workspaces, ...preferences]


export { workspaces, preferences, allPages }