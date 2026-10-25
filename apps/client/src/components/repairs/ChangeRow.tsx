import { AlertTriangle, Check, X } from "../../libs";
import type { ProposedChange, ReviewStatus } from "../../types/repairs.types";
import { changeKind } from "../../utils/groupChanges";

function show(value: unknown) {
    if (value === null || value === undefined || value === "") return "empty";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

interface ChangeRowProps {
    change: ProposedChange;
    decision: ReviewStatus;
    onDecide: (id: string, status: ReviewStatus) => void;
}

export default function ChangeRow({ change, decision, onDecide }: ChangeRowProps) {
    const kind = changeKind(change);
    const rejected = decision === "rejected";

    return (
        <li className={`grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${rejected ? "bg-mist" : "bg-white"}`}>
            <div className="min-w-0">
                <p className="text-xs text-muted">
                    Row {String(change.row_index)}
                    {change.method ? ` · ${change.method}` : ""}
                </p>

                {kind === "review" && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-ink">
                        <AlertTriangle size={15} className="shrink-0 text-brand" />
                        Anomaly score {change.details?.anomaly_score ?? "unavailable"}
                    </p>
                )}

                {kind === "duplicate" && <p className="mt-1 truncate text-sm text-ink">{show(change.original_value)}</p>}

                {kind === "value" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-md px-2 py-1 text-muted line-through ring-1 ring-line">{show(change.original_value)}</span>
                        <span aria-hidden="true" className="text-muted">→</span>
                        <span className={`rounded-md px-2 py-1 font-semibold ${rejected ? "bg-line text-muted" : "bg-brand-soft text-brand"}`}>{show(change.proposed_value)}</span>
                    </div>
                )}
            </div>

            {kind === "review" ? (
                <button type="button" aria-pressed={decision === "accepted"} onClick={() => onDecide(change.id, decision === "accepted" ? "pending" : "accepted")}
                    className={`justify-self-end rounded-lg px-3 py-2 text-sm font-medium transition ${decision === "accepted"
                        ? "bg-brand-soft text-brand"
                        : "ring-1 ring-line text-muted hover:text-ink"}`
                    }
                >
                    {decision === "accepted" ? "Reviewed" : "Mark reviewed"}
                </button>
            ) : (
                <div role="group" aria-label={`Decision for row ${String(change.row_index)}`}
                    className="flex justify-self-end overflow-hidden rounded-lg ring-1 ring-line"
                >
                    <button type="button" aria-pressed={rejected} onClick={() => onDecide(change.id, rejected ? "pending" : "rejected")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${rejected
                            ? "bg-ink text-white"
                            : "bg-white text-muted hover:text-ink"}`
                        }
                    >
                        <X size={15} /> Reject
                    </button>
                    <button type="button" aria-pressed={decision === "accepted"} onClick={() => onDecide(change.id, decision === "accepted" ? "pending" : "accepted")}
                        className={`flex items-center gap-1.5 border-l border-line px-3 py-2 text-sm font-medium transition ${decision === "accepted"
                            ? "bg-brand text-white"
                            : "bg-white text-muted hover:text-brand"}`
                        }
                    >
                        <Check size={15} /> Accept
                    </button>
                </div>
            )}
        </li>
    )
}