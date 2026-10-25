import { CheckCheck, Clock, Sparkles, X } from "../libs";
import type { Counts, CountsReturns, ReviewStatus } from "../types/repairs.types";


type RepairStats = (arg: Counts) => CountsReturns[];
const repairStats: RepairStats = (counts) => ([
    {
        label: "Proposed changes",
        value: counts.total,
        icon: Sparkles,
        color: "text-indigo-600 bg-indigo-50",
    },
    {
        label: "Awaiting review",
        value: counts.pending,
        icon: Clock,
        color: "text-amber-600 bg-amber-50",
    },
    {
        label: "Accepted",
        value: counts.accepted,
        icon: CheckCheck,
        color: "text-emerald-600 bg-emerald-50",
    },
    {
        label: "Rejected",
        value: counts.rejected,
        icon: X,
        color: "text-rose-600 bg-rose-50",
    },
])

const status: readonly (ReviewStatus | "all")[] = ["all", "pending", "accepted", "rejected"];

const statusStyles: Record<ReviewStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
};

export { repairStats, status, statusStyles }