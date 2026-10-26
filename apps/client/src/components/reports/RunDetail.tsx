import { X } from "../../libs";
import ErrorBreakdown from "./ErrorBreakdown";
import type { CleaningRun } from "../../types/reports.types";

interface RunDetailProps {
    run: CleaningRun;
    onClose: () => void;
}

function Compare({ label, before, after }: { label: string; before: number; after: number }) {
    return (
        <div className="rounded-xl bg-mist p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-2 flex items-baseline gap-2 tabular-nums">
                <span className="text-muted line-through">{before.toLocaleString()}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-lg font-bold text-ink">{after.toLocaleString()}</span>
            </p>
        </div>
    )
}

export default function RunDetail({ run, onClose }: RunDetailProps) {
    return (
        <aside aria-label="Run details" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted">{new Date(run.createdAt).toLocaleString()}</p>
                    <h2 className="mt-1 truncate font-semibold text-ink">{run.datasetName}</h2>
                </div>
                <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-2 text-muted hover:bg-mist hover:text-ink">
                    <X size={18} />
                </button>
            </header>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <Compare label="Rows" before={run.rowsBefore} after={run.rowsAfter} />
                <Compare label="Missing values" before={run.missingBefore} after={run.missingAfter} />
            </div>

            <h3 className="mt-8 text-sm font-semibold text-ink">What changed</h3>
            <div className="mt-4">
                <ErrorBreakdown items={run.breakdown} />
            </div>
        </aside>
    )
}