import type { LucideIcon } from "lucide-react";

type ReviewStatus = "pending" | "accepted" | "rejected";

interface ProposedChange {
    id: string;
    type: string;
    column: string | null;
    row_index: number | string;
    original_value: unknown;
    proposed_value: unknown;
    method?: string | null;
    details?: {
        anomaly_score: number;
        numeric_columns: string[];
    }
}

interface Counts {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
}

interface CountsReturns {
    label: string,
    value: number,
    icon: LucideIcon,
    color: string
}


export type { Counts, CountsReturns, ProposedChange, ReviewStatus }