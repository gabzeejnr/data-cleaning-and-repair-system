import { CheckCheck, Copy, RefreshCw, Trash2 } from "../libs"
import type { SummarizeRuns } from "../types"

const ERROR_LABELS: Record<string, string> = {
    whitespace_standardization: "Whitespace trimmed",
    missing_value_imputation: "Missing values filled",
    exact_duplicate_removal: "Duplicate rows removed",
    duplicate_rows: "Duplicate rows removed",
    outlier_review: "Rows flagged for review",
}

const reportsLabels = (stats: SummarizeRuns) => [
    { label: "Cleaning runs", value: stats.runCount, icon: CheckCheck },
    { label: "Records repaired", value: stats.recordsRepaired, icon: Copy },
    { label: "Missing values filled", value: stats.missingFilled, icon: RefreshCw },
    { label: "Duplicates removed", value: stats.duplicatesRemoved, icon: Trash2 },
]


export { ERROR_LABELS, reportsLabels }