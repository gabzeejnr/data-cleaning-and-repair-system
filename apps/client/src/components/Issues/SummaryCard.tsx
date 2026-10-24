import type { LucideIcon } from "lucide-react";


export default function SummaryCard({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{title}</p>
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Icon size={20} />
                </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
        </div>
    )
}