import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Database, FileSpreadsheet, RefreshCw } from "../../libs"
import axios from "axios";
import { API } from "../../apis/axios";
import type { Dataset } from "@data-cleaning-system/shared";
import type { DatasetsResponse } from "../../types";

export default function RecentDatasets() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchDatasets() {
        setLoading(true);
        setError(null);

        try {
            const { data } = await API.get<DatasetsResponse>(
                "/datasets?limit=5"
            );

            setDatasets(data.data);
        } catch (err) {
            if (axios.isAxiosError<{ error?: string }>(err)) {
                setError(
                    err.response?.data?.error ??
                    "Unable to load your recent datasets."
                );
            } else {
                setError("Unable to load your recent datasets.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchDatasets();
    }, []);

    return (
        <section className="rounded-2xl border border-border bg-bg-secondary">
            <div className="flex items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
                <div>
                    <h2 className="font-semibold text-text-primary">Recent datasets</h2>
                    <p className="mt-1 text-sm text-text-secondary">Your latest uploaded files</p>
                </div>

                <Link to="/datasets"
                    className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-hover"
                >
                    View all
                    <ArrowRight size={16} />
                </Link>
            </div>

            {loading ? (
                <div className="grid min-h-48 place-items-center">
                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <RefreshCw size={18} className="animate-spin text-brand" />
                        Loading datasets...
                    </div>
                </div>
            ) : error ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                    <p className="text-sm text-danger">{error}</p>
                    <button type="button" onClick={() => void fetchDatasets()}
                        className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover"
                    >
                        Try again
                    </button>
                </div>
            ) : datasets.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center bg-bg-primary">
                    <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                        <Database size={23} />
                    </div>

                    <h3 className="mt-4 font-semibold text-text-primary">No datasets yet</h3>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-text-secondary">
                        Upload a CSV, Excel of PDF file to start profiling and cleaning your data.
                    </p>

                    <Link to="/datasets"
                        className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
                    >Get started</Link>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {datasets.map(dataset => (
                        <div key={dataset.id}
                            className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-bg-primary sm:px-6"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                                    <FileSpreadsheet size={21} />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                        {dataset.filename}
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        {dataset.rowCount.toLocaleString()} rows
                                        <span className="mx-1.5 text-text-secondary/60">·</span>
                                        {dataset.columnCount.toLocaleString()} columns
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        {new Date(dataset.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${dataset.status === "repaired" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"} select-none`}>
                                {dataset.status.capitalize()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}