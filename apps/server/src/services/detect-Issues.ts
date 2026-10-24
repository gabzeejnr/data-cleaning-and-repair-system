import type { DataIssue, DatasetProfile, IssueSeverity } from "@data-cleaning-system/shared";

function detectIssues(datasetId: string, profile: DatasetProfile): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const column of profile.columns) {
        if (column.missingCount > 0) {
            const severity: IssueSeverity = (column.missingPercentage >= 30
                ? "high"
                : (column.missingPercentage >= 10
                    ? "medium"
                    : "low"
                )
            )
            const severityIssue: DataIssue = {
                id: `${datasetId}:missing:${column.name}`,
                datasetId,
                type: "missing_values",
                severity,
                column: column.name,
                description:
                    `${column.missingCount} missing ${column.missingCount === 1 ? "value" : "values"} in "${column.name}".`,
                affectedRows: column.missingCount,
            }
            issues.push(severityIssue);
        }

        const outliers = column.outlierAnalysis?.outliers;
        if (outliers && outliers.length > 0) {
            const outlierIssue: DataIssue = {
                id: `${datasetId}:outliers:${column.name}`,
                datasetId,
                type: "outliers",
                severity: "medium",
                column: column.name,
                description:
                    `${outliers.length} potential ${outliers.length === 1 ? "outlier" : "outliers"} detected in "${column.name}".`,
                affectedRows: outliers.length,
            }
            issues.push(outlierIssue);
        }
    }

    if (profile.duplicateRows > 0) {
        issues.push({
            id: `${datasetId}:duplicates`,
            datasetId,
            type: "duplicate_rows",
            severity: "medium",
            description: `${profile.duplicateRows} duplicate ${profile.duplicateRows === 1 ? "row" : "rows"} detected.`,
            affectedRows: profile.duplicateRows,
        });
    }

    return issues;
}



export { detectIssues }