import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, LoaderCircle } from "../libs";
import { API } from "../apis/axios";
import DatasetSelector from "../components/datasets/DatasetSelector";
import SummaryCard from "../components/Issues/SummaryCard";
import type { Dataset, DataIssue } from "@data-cleaning-system/shared";
import PageHeader from "../components/PageHeader";

interface GetDatasetsResponse {
    message: string;
    data: Dataset[];
}

interface GetIssuesResponse {
    message: string;
    data: DataIssue[];
}

function SeverityBadge({ severity }: { severity: DataIssue["severity"] }) {
    const styles: Record<DataIssue["severity"], string> = {
        low: "bg-success/10 text-success",
        medium: "bg-warning/10 text-warning",
        high: "bg-danger/10 text-danger",
    }

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[severity]}`}>
            {severity}
        </span>
    )
}


export default function Issues() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [issues, setIssues] = useState<DataIssue[]>([]);
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [error, setError] = useState("");
    const missingIssues = issues.filter(issue => issue.type === "missing_values").length;
    const duplicateIssues = issues.filter(issue => issue.type === "duplicate_rows").length;
    const outlierIssues = issues.filter(issue => issue.type === "outliers").length;


    useEffect(() => {
        async function getDatasets() {
            try {
                const response = await API.get<GetDatasetsResponse>("/datasets");

                const availableDatasets = response.data.data;
                setDatasets(availableDatasets);

                if (availableDatasets.length > 0) setSelectedDatasetId(availableDatasets[0].id)
            } catch {
                setError("Failed to load datasets. Please try again.");
            } finally {
                setLoadingDatasets(false);
            }
        }

        void getDatasets();
    }, []);

    useEffect(() => {
        if (!selectedDatasetId) {
            setIssues([]);
            return;
        }

        let cancelled = false;

        async function getIssues() {
            setLoadingIssues(true);
            setError("");

            try {
                const response = await API.get<GetIssuesResponse>(
                    `/datasets/${selectedDatasetId}/issues`
                );

                if (!cancelled) setIssues(response.data.data)
            } catch {
                if (!cancelled) {
                    setIssues([]);
                    setError("Failed to load issues. Please try again.");
                }
            } finally {
                if (!cancelled) setLoadingIssues(false)
            }
        }

        void getIssues();

        return () => {
            cancelled = true;
        };
    }, [selectedDatasetId]);

    return (
        <main className="space-y-6">
            <PageHeader title="Data Quality Issues" subtitle="Inspect missing values, duplicates, and potential outliers." />

            <section className="rounded-2xl border border-border bg-bg-secondary p-5">
                {loadingDatasets ? (
                    <p className="flex items-center gap-2 text-sm text-text-secondary">
                        <LoaderCircle size={16} className="animate-spin" />
                        Loading datasets...
                    </p>
                ) : datasets.length === 0 ? (
                    <p className="text-sm text-text-secondary">No datasets found. Upload a dataset to inspect its issues.</p>
                ) : (
                    <DatasetSelector datasets={datasets} value={selectedDatasetId} onChange={setSelectedDatasetId} disabled={loadingIssues} />
                )}
            </section>

            {error && (
                <p role="alert" className="text-sm text-danger">{error}</p>
            )}

            {selectedDatasetId && !loadingDatasets
                && <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Total issues" value={issues.length} icon={AlertCircle} />
                        <SummaryCard title="Missing values" value={missingIssues} icon={AlertTriangle} />
                        <SummaryCard title="Duplicate issues" value={duplicateIssues} icon={CheckCircle2} />
                        <SummaryCard title="Outlier issues" value={outlierIssues} icon={AlertTriangle} />
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
                        <div className="border-b border-border p-5">
                            <h2 className="font-semibold text-text-primary">Detected issues</h2>
                            <p className="mt-1 text-sm text-text-secondary">Review the findings for the selected dataset.</p>
                        </div>

                        {loadingIssues ? (
                            <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-secondary">
                                <LoaderCircle size={18} className="animate-spin" />
                                Loading issues...
                            </div>
                        ) : issues.length === 0 && !error ? (
                            <div className="p-10 text-center">
                                <CheckCircle2 size={32} className="mx-auto text-success" />
                                <h3 className="mt-3 font-medium text-text-primary">No issues detected</h3>
                                <p className="mt-1 text-sm text-text-secondary">The profiler did not find any issues in this dataset.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-bg-primary text-text-secondary">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Issue</th>
                                            <th className="px-5 py-3 font-medium">Column</th>
                                            <th className="px-5 py-3 font-medium">Severity</th>
                                            <th className="px-5 py-3 font-medium">Affected rows</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {issues.map(issue => (
                                            <tr key={issue.id} className="hover:bg-bg-primary">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-text-primary">{issue.type.replaceAll("_", " ").capitalize()}</p>
                                                    <p className="mt-1 text-xs text-text-secondary">{issue.description}</p>
                                                </td>
                                                <td className="px-5 py-4 text-text-secondary">{issue.column ?? "—"}</td>
                                                <td className="px-5 py-4">
                                                    <SeverityBadge severity={issue.severity} />
                                                </td>
                                                <td className="px-5 py-4 tabular-nums text-text-secondary">{issue.affectedRows.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            }
        </main>
    )
}