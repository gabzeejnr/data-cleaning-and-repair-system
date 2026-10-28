import { theme } from "../../libs";
import type { StatCardProps } from "../../types";




export default function StatCard({ title, value, icon: Icon, description, accent = "indigo", id }: StatCardProps) {
    const t = theme[accent];

    return (
        <article id={id}
            className="group relative isolate min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10"
        >
            <div aria-hidden
                className={`pointer-events-none absolute -right-10 -top-10 -z-10 size-32 rounded-full opacity-30 blur-3xl transition duration-300 group-hover:scale-110 group-hover:opacity-50 ${t.glow}`}
            />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
                    <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-[#11133B]">{value}</p>
                </div>

                <div className={`grid size-11 shrink-0 place-items-center rounded-xl shadow-lg ${t.tile}`}>
                    <Icon size={20} strokeWidth={1.8} />
                </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3">
                <p className="text-sm leading-5 text-slate-500">{description}</p>
            </div>

            <div aria-hidden className={`absolute inset-x-0 bottom-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full ${t.bar}`} />
        </article>
    )
}