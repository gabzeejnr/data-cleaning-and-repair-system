import { Link } from "react-router-dom";
import { ArrowRight, Upload } from "../libs";
import { stats, quickActions } from "../data";
import StatCard from "../components/Dashboard/StatCard";
import RecentDatasets from "../components/Dashboard/RecentDatasets";

export default function Dashboard() {
    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-medium text-indigo-600">Workspace overview</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#11133B] sm:text-3xl">Your data at a glance</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Monitor dataset quality, identify issues, and keep your data reliable.</p>
                </div>

                <Link to="/datasets" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:self-auto">
                    <Upload size={18} />
                    Upload dataset
                </Link>
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-[#11133B]">Summary</h2>
                    <p className="mt-1 text-sm text-slate-500">A snapshot of your data-cleaning activity.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <RecentDatasets />

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="font-semibold text-[#11133B]">
                        Quick actions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Continue working with your data.
                    </p>

                    <div className="mt-5 space-y-3">
                        {quickActions.map((action) => (
                            <Link key={action.to} to={action.to} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/50">
                                <div>
                                    <p className="text-sm font-medium text-[#11133B]">{action.label}</p>
                                    <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                                </div>

                                <ArrowRight size={17} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}