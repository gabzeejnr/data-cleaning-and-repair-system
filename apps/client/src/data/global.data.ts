import { CircleAlert, Database, FileChartColumn, LayoutDashboard, Settings, Settings2, WandSparkles, User } from "../libs"
import type { PagesType } from "../types";

const workspaces: PagesType[] = [
    {
        label: "Overview",
        path: "/",
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

const accounts: PagesType[] = [
    {
        icon: User,
        label: "Account",
        path: "/settings/account",
        text: "Manage account preferences"
    },
    {
        icon: Settings2,
        label: "General Preferences",
        path: "/settings/general",
        text: "Change App preferences"
    },
    {
        icon: Settings,
        label: "Security",
        path: "/settings/security",
        text: "Security"
    }
]

const allPages: PagesType[] = [...workspaces, ...accounts]


export { workspaces, accounts, allPages }