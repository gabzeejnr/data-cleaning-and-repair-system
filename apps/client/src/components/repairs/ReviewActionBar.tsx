import { CheckCheck, RefreshCw } from "../../libs";

interface ReviewActionBarProps {
    approved: number;
    applyable: number;
    pending: number;
    loading: boolean;
    onApply: () => void;
}

export default function ReviewActionBar({ approved, applyable, pending, loading, onApply }: ReviewActionBarProps) {
    return (
        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm font-semibold text-ink">{approved} of {applyable} changes approved</p>
                <p className="text-xs text-muted">
                    {pending > 0
                        ? `${pending} still awaiting a decision. Rejected and undecided changes keep their original values.`
                        : "Every change has a decision."
                    }
                </p>
            </div>

            <button type="button" onClick={onApply} disabled={approved === 0 || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {loading
                    ? <RefreshCw size={17} className="animate-spin" />
                    : <CheckCheck size={17} />
                }
                {loading
                    ? "Applying…"
                    : "Apply approved changes"
                }
            </button>
        </div>
    )
}