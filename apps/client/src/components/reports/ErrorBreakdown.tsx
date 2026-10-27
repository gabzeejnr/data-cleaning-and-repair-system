import { labelFor } from "../../utils";
import type { ReportBreakdown } from "../../types";

export default function ErrorBreakdown({ items }: { items: ReportBreakdown[] }) {
    const max = Math.max(1, ...items.map(item => item.recordsAffected));

    return (
        <ul className="space-y-4">
            {items.map(item => (
                <li key={`${item.errorType}-${item.actionTaken}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium text-ink">{labelFor(item.errorType)}</span>
                        <span className="tabular-nums text-muted">{item.recordsAffected.toLocaleString()}</span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist ring-1 ring-line">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(item.recordsAffected / max) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{item.actionTaken}</p>
                </li>
            ))}
        </ul>
    );
}