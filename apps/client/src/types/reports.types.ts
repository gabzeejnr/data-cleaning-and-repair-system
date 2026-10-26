interface ReportBreakdown {
    errorType: string;
    recordsAffected: number;
    actionTaken: string;
}

interface CleaningRun {
    id: string;
    datasetId: string;
    datasetName: string;
    createdAt: string;
    rowsBefore: number;
    rowsAfter: number;
    missingBefore: number;
    missingAfter: number;
    breakdown: ReportBreakdown[];
}

interface SummarizeRuns {
    runCount: number;
    recordsRepaired: number;
    missingFilled: number;
    duplicatesRemoved: number;
}

export type { ReportBreakdown, CleaningRun, SummarizeRuns }