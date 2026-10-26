import { ERROR_LABELS } from "../data";
import type { CleaningRun, SummarizeRuns } from "../types";

const labelFor = (errorType: string) => (ERROR_LABELS[errorType] ?? errorType.replaceAll("_", " "));

function summarizeRuns(runs: CleaningRun[]): SummarizeRuns {
    const sumOf = (types: string[]) => runs.reduce((total, run) => total + run.breakdown.filter(r => types.includes(r.errorType))
        .reduce((n, item) => n + item.recordsAffected, 0),
        0
    )

    return {
        runCount: runs.length,
        recordsRepaired: runs.reduce((total, run) => total + run.breakdown
            .filter(i => i.errorType !== "outlier_review")
            .reduce((n, item) => n + item.recordsAffected, 0),
            0
        ),
        missingFilled: sumOf(["missing_value_imputation"]),
        duplicatesRemoved: sumOf(["exact_duplicate_removal", "duplicate_rows"])
    }
}

export { labelFor, summarizeRuns }