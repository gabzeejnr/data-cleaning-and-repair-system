import { FileCheck2, Sparkles } from "../../libs"


export default function RepairsHeader() {
    return (
        <section className="overflow-hidden rounded-2xl bg-[#171A3B] text-white">
            <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
                <div className="max-w-xl">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-200">
                        <Sparkles size={17} />
                        Data quality workspace
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review your repairs</h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100/80">
                        Inspect proposed data corrections, decide what to keep, and apply only the changes you approve.
                    </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl border border-white/10 bg-white/10 lg:self-center">
                    <FileCheck2 size={32} />
                </div>
            </div>
        </section>
    )
}