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
                "/datasets/get-datasets?limit=5"
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
        <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div>
                    <h2 className="font-semibold text-[#11133B]">
                        Recent datasets
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Your latest uploaded files
                    </p>
                </div>

                <Link
                    to="/datasets"
                    className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                    View all
                    <ArrowRight size={16} />
                </Link>
            </div>

            {loading ? (
                <div className="grid min-h-48 place-items-center">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <RefreshCw size={18} className="animate-spin text-indigo-600" />
                        Loading datasets...
                    </div>
                </div>
            ) : error ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                    <p className="text-sm text-rose-600">{error}</p>
                    <button
                        type="button"
                        onClick={() => void fetchDatasets()}
                        className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        Try again
                    </button>
                </div>
            ) : datasets.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Database size={23} />
                    </div>

                    <h3 className="mt-4 font-semibold text-[#11133B]">
                        No datasets yet
                    </h3>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                        Upload a CSV or Excel file to start profiling and cleaning your data.
                    </p>

                    <Link
                        to="/datasets"
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Get started
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {datasets.map((dataset) => (
                        <div
                            key={dataset.id}
                            className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <FileSpreadsheet size={21} />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[#11133B]">
                                        {dataset.filename}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {dataset.rowCount.toLocaleString()} rows
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        {dataset.columnCount.toLocaleString()} columns
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {new Date(dataset.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                {dataset.status.capitalize()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}