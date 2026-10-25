export interface ReportBreakdown {
    errorType: string;
    recordsAffected: number;
    actionTaken: string;
}

export interface CleaningRun {
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