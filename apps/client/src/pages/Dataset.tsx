import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Database, RefreshCw } from "../libs";
import { getUploadErrorMessage } from "../utils";
import { API } from "../apis/axios";
import PageHeader from "../components/PageHeader";
import DatasetTable from "../components/Dataset/Table";
import type { Dataset, DatasetProfile, DatasetRow, getDatasetIdResponse } from "@data-cleaning-system/shared";
import ColumnProfile from "../components/Dataset/ColumnProfile";

export default function Dataset() {

    const { id } = useParams<"id">();
    const [rows, setRows] = useState<DatasetRow[] | null>(null);
    const [rowCount, setRowCount] = useState<Dataset["rowCount"] | null>(null);
    const [profile, setProfile] = useState<DatasetProfile | null>(null);
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
        setProfile(null);
        setLoading(true);
        setError(null);

        try {
            const { data } = await API.get<{ data: getDatasetIdResponse }>(`/datasets/${id}`);
            setRows(data.data.rows);
            setRowCount(data.data.dataset.rowCount);
            setProfile(data.data.profile)
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
        <main className="space-y-8 p-3 sm:p-5 lg:p-4">
            <PageHeader title="Dataset Details" subtitle="Inspect your dataset and review its records."
            back backText="Back to datasets" backLink="/datasets">
                <button type="button" onClick={() => void getRows()} disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
            </button>
            </PageHeader>

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

            <ColumnProfile columns={profile?.columns ?? []} loading={loading} />
            <DatasetTable rows={rows} columns={columns} loading={loading} error={error} getRows={getRows} />
        </main>
    )
}