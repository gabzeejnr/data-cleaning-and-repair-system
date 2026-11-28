import type { LucideIcon } from "lucide-react";


export default function SummaryCard({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {

    return (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">{title}</p>
                <span className="rounded-lg bg-brand-soft p-2 text-brand">
                    <Icon size={20} />
                </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-text-primary">{value.toLocaleString()}</p>
        </div>
    )
}