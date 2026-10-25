import { useState } from "react";
import { ChevronDown } from "../../libs";
import type { ReviewStatus } from "../../types/repairs.types";
import type { ChangeGroup } from "../../utils/groupChanges";
import ChangeRow from "./ChangeRow";

interface ChangeGroupCardProps {
    group: ChangeGroup;
    decisions: Record<string, ReviewStatus>;
    onDecide: (id: string, status: ReviewStatus) => void;
    onDecideAll: (ids: string[], status: ReviewStatus) => void;
}

export default function ChangeGroupCard({ group, decisions, onDecide, onDecideAll }: ChangeGroupCardProps) {
    const [open, setOpen] = useState(true);
    const ids = group.changes.map(change => change.id);
    const approved = ids.filter(id => decisions[id] === "accepted").length;
    const rejected = ids.filter(id => decisions[id] === "rejected").length;
    const isReview = group.kind === "review";

    return (
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <button type="button" onClick={() => setOpen(current => !current)} aria-expanded={open} className="flex min-w-0 items-center gap-3 text-left">
                    <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{group.title}</span>
                        <span className="block truncate text-xs text-muted">{group.subtitle}</span>
                    </span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                        {isReview
                            ? `${approved} of ${ids.length} reviewed`
                            : `${approved} approved · ${rejected} rejected · ${ids.length} total`
                        }
                    </span>

                    {!isReview && (
                        <>
                            <button type="button" onClick={() => onDecideAll(ids, "accepted")}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand ring-1 ring-line hover:bg-brand-soft"
                            >
                                Accept all
                            </button>
                            <button type="button" onClick={() => onDecideAll(ids, "rejected")}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line hover:text-ink"
                            >
                                Reject all
                            </button>
                        </>
                    )}
                </div>
            </header>

            {open && <ul className="divide-y divide-mist border-t border-mist">
                {group.changes.map(change => (
                    <ChangeRow key={change.id} change={change}
                        decision={decisions[change.id] ?? "pending"} onDecide={onDecide}
                    />
                ))}
            </ul>}
        </section>
    )
}