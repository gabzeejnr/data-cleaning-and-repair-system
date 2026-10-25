import { accents } from "../../libs";
import type { StatCardProps } from "../../types";

export default function StatCard({
    title, value, icon: Icon, description, accent = "indigo"
}: StatCardProps) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md hover:shadow-slate-200/50">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-[#11133B] sm:text-3xl">{value}</p>
                </div>

                <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${accents[accent]}`}>
                    <Icon size={21} strokeWidth={1.9} />
                </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
        </article>
    )
}
