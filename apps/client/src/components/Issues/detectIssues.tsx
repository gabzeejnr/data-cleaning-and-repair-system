import type { DatasetProfile } from "@data-cleaning-system/shared";

export type IssueType =
    | "missing_values"
    | "duplicate_rows"
    | "outliers";

export type IssueSeverity = "low" | "medium" | "high";

export interface DataIssue {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    column?: string;
    description: string;
    affectedRows: number;
}

export function detectIssues(
    datasetId: string,
    profile: DatasetProfile
): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const column of profile.columns) {
        if (column.missingCount > 0) {
            issues.push({
                id: `${datasetId}:missing:${column.name}`,
                type: "missing_values",
                severity:
                    column.missingPercentage >= 30
                        ? "high"
                        : column.missingPercentage >= 10
                            ? "medium"
                            : "low",
                column: column.name,
                description: `${column.missingCount} missing value(s) in "${column.name}".`,
                affectedRows: column.missingCount,
            });
        }

        const outliers = column.outlierAnalysis?.outliers;

        if (outliers && outliers.length > 0) {
            issues.push({
                id: `${datasetId}:outliers:${column.name}`,
                type: "outliers",
                severity: "medium",
                column: column.name,
                description: `${outliers.length} potential outlier(s) detected in "${column.name}".`,
                affectedRows: outliers.length,
            });
        }
    }

    if (profile.duplicateRows > 0) {
        issues.push({
            id: `${datasetId}:duplicates`,
            type: "duplicate_rows",
            severity: "medium",
            description: `${profile.duplicateRows} duplicate row(s) detected.`,
            affectedRows: profile.duplicateRows,
        });
    }

    return issues;
}
