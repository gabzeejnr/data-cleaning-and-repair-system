import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "../../libs";

export default function DatasetHeader({ getRows, loading }: { loading: boolean, getRows(): Promise<void> }) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <Link to="/datasets" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
                    <ArrowLeft size={16} />
                    Back to datasets
                </Link>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dataset Details</h1>
                <p className="mt-1 text-sm text-slate-500">Inspect your dataset and review its records.</p>
            </div>

            <button type="button" onClick={() => void getRows()} disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
            </button>
        </header>
    )
}