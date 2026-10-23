import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../apis/axios";
import { ArrowUpDown, Search } from "../libs"
import type { Dataset } from "@data-cleaning-system/shared";
import type { DatasetsResponse } from "../types";
import UploadDatasetModal from "../components/dataset/UploadDatasetModal";

export default function Datasets() {

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"createdAt" | "filename" | "rowCount" | "columnCount">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const filteredDatasets = datasets
        .filter((dataset) =>
            dataset.filename.toLowerCase().includes(search.trim().toLowerCase())
        ).sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case "filename":
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case "rowCount":
                    comparison = a.rowCount - b.rowCount;
                    break;
                case "columnCount":
                    comparison = a.columnCount - b.columnCount;
                    break;
                case "createdAt":
                    comparison =
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime();
                    break;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

    async function fetchDatasets() {
        setLoading(true);
        setError(null);

        try {
            const { data } = await API.get<DatasetsResponse>(
                "/datasets/get-datasets"
            );

            setDatasets(data.data);
        } catch (err) {
            if (axios.isAxiosError<{ error?: string }>(err)) {
                setError(
                    err.response?.data?.error ??
                    "Unable to load your datasets."
                );
            } else {
                setError("Unable to load your datasets.");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(file: File, name: string) {
        const formData = new FormData();
        formData.append("file", file);

        if (name) formData.append("name", name);

        await API.post("/datasets/upload", formData);
        await fetchDatasets();
        setIsUploadOpen(false);
    }


    useEffect(() => {
        void fetchDatasets();
    }, []);

    return (
        <>
            <section className="space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#11133B]">Datasets</h1>
                        <p className="mt-1 text-sm text-slate-500">Manage and inspect your uploaded data.</p>
                    </div>

                    <button type="button" onClick={() => setIsUploadOpen(true)} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
                        + Upload dataset
                    </button>
                </header>

                {loading ? (
                    <p className="py-12 text-center text-sm text-slate-500">Loading datasets...</p>
                ) : error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                        <p className="text-sm text-rose-700">{error}</p>
                        <button type="button" onClick={() => void fetchDatasets()} className="mt-3 text-sm font-semibold text-indigo-600">Try again</button>
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                        <h2 className="font-semibold text-[#11133B]">No datasets yet</h2>
                        <p className="mt-2 text-sm text-slate-500">Upload a CSV or Excel file to get started.</p>
                        <button type="button" onClick={() => setIsUploadOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                            Upload your first dataset
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search datasets..." aria-label="Search datasets by filename"
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort datasets by"
                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-500 sm:flex-none"
                                >
                                    <option value="createdAt">Upload date</option>
                                    <option value="filename">Filename</option>
                                    <option value="rowCount">Row count</option>
                                    <option value="columnCount">Column count</option>
                                </select>

                                <button type="button" onClick={() => setSortOrder((current) => current === "asc" ? "desc" : "asc")}
                                    aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`} title={sortOrder === "asc" ? "Descending" : "Ascending"}
                                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                                >
                                    <ArrowUpDown size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">


                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Filename</th>
                                        <th className="px-6 py-4">Rows</th>
                                        <th className="px-6 py-4">Columns</th>
                                        <th className="px-6 py-4">Uploaded</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDatasets.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">No datasets match "{search}".</td>
                                        </tr>
                                    )}
                                    {filteredDatasets.map((dataset) => (
                                        <tr key={dataset.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-medium text-[#11133B]">{dataset.filename}</td>
                                            <td className="px-6 py-4 text-slate-600">{dataset.rowCount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-slate-600">{dataset.columnCount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-slate-600">{new Date(dataset.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{dataset.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>

            {isUploadOpen && <UploadDatasetModal onClose={() => setIsUploadOpen(false)} onUpload={handleUpload} />}
        </>
    )
}