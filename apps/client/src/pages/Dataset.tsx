import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Database } from "../libs";
import { getUploadErrorMessage } from "../utils";
import { API } from "../apis/axios";
import DatasetTable from "../components/Dataset/Table";
import type { Dataset, DatasetRow, getDatasetIdResponse } from "@data-cleaning-system/shared";
import DatasetHeader from "../components/Dataset/Header";

export default function Dataset() {

    const { id } = useParams<"id">();
    const [rows, setRows] = useState<DatasetRow[] | null>(null);
    const [rowCount, setRowCount] = useState<Dataset["rowCount"] | null>(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function getRows() {
        if (!id) {
            setError("Dataset ID is missing.");
            setLoading(false);
            return;
        }

        setRowCount(null);
        setRows(null);
        setLoading(true);
        setError(null);

        try {
            const { data } = await API.get<{ data: getDatasetIdResponse }>(`/datasets/get-dataset/${id}`);
            setRows(data.data.rows);
            setRowCount(data.data.dataset.rowCount)
        } catch (err) {
            setError(getUploadErrorMessage(err, "Dataset fetching failed. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void getRows();
    }, [id]);

    const columns = rows?.length ? Object.keys(rows[0]) : [];

    return (
        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
            <DatasetHeader loading={loading} getRows={getRows} />

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                            <Database size={21} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total records</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {loading ? "—" : (rowCount ?? 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                            <Database size={21} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total columns</p>
                            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : columns.length.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="font-semibold text-slate-900">Data preview</h2>
                    <p className="mt-1 text-sm text-slate-500">Review the records stored in this dataset.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                        <RefreshCw size={18} className="animate-spin text-indigo-600" />
                        Loading dataset...
                    </div>
                ) : error ? (
                    <div className="p-10 text-center">
                        <p className="font-medium text-red-600">{error}</p>
                        <button type="button" onClick={() => void getRows()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                            Try again
                        </button>
                    </div>
                ) : !rows?.length ? (
                    <div className="p-12 text-center">
                        <Database size={32} className="mx-auto text-slate-300" />
                        <p className="mt-3 font-semibold text-slate-800">No records found</p>
                        <p className="mt-1 text-sm text-slate-500">This dataset doesn't contain any rows to preview.</p>
                    </div>
                ) : (
                    <DatasetTable rows={rows} columns={columns} />
                )}
            </section>
        </main>
    )
}