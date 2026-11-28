import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Upload } from "../libs";
import { getDashboardSummary, getStats, quickActions } from "../data";
import StatCard from "../components/Dashboard/StatCard";
import RecentDatasets from "../components/Dashboard/RecentDatasets";
import type { StatCardProps } from "../types";

export default function Dashboard() {

    const [stats, setStats] = useState<readonly StatCardProps[]>([]);

    useEffect(() => {
        getDashboardSummary()
            .then(summary => setStats(getStats(summary)))
            .catch(console.error)
    }, [])


    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-medium text-brand">Workspace overview</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Your data at a glance</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Monitor dataset quality, identify issues, and keep your data reliable.</p>
                </div>

                <Link to="/datasets" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto">
                    <Upload size={18} />
                    Upload dataset
                </Link>
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-text-primary">Summary</h2>
                    <p className="mt-1 text-sm text-text-secondary">A snapshot of your data-cleaning activity.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map(stat => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <RecentDatasets />

                <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                    <h2 className="font-semibold text-text-primary">
                        Quick actions
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        Continue working with your data.
                    </p>

                    <div className="mt-5 space-y-3">
                        {quickActions.map(action => (
                            <Link key={action.to} to={action.to} className="group flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition hover:border-brand/40 hover:bg-bg-primary">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{action.label}</p>
                                    <p className="mt-1 text-xs text-text-secondary">{action.description}</p>
                                </div>

                                <ArrowRight size={17} className="shrink-0 text-text-secondary transition group-hover:translate-x-1 group-hover:text-brand" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}