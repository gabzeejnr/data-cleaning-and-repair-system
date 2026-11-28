import { CheckCheck, Clock, Sparkles, X } from "../libs";
import type { Counts, CountsReturns, ReviewStatus } from "../types/repairs.types";


type RepairStats = (arg: Counts) => CountsReturns[];
const repairStats: RepairStats = (counts) => ([
    {
        label: "Proposed changes",
        value: counts.total,
        icon: Sparkles,
        color: "text-brand bg-brand-soft",
    },
    {
        label: "Awaiting review",
        value: counts.pending,
        icon: Clock,
        color: "text-warning bg-warning/10",
    },
    {
        label: "Accepted",
        value: counts.accepted,
        icon: CheckCheck,
        color: "text-success bg-success/10",
    },
    {
        label: "Rejected",
        value: counts.rejected,
        icon: X,
        color: "text-danger bg-danger/10",
    },
])

const status: readonly (ReviewStatus | "all")[] = ["all", "pending", "accepted", "rejected"];

const statusStyles: Record<ReviewStatus, string> = {
    pending: "bg-warning/10 text-warning",
    accepted: "bg-success/10 text-success",
    rejected: "bg-danger/10 text-danger",
};

export { repairStats, status, statusStyles }