import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm, RegisterForm } from "../components/Forms";
import { FileSpreadsheet, Copy, Wrench, Sparkles, type LucideIcon } from "lucide-react";

function Card({ number, text, icon, color }: {
    number: number,
    text: string,
    icon: LucideIcon,
    color: string
}) {

    const Icon = icon
    return (
        <div className="rounded-xl border border-white/10 bg-white/4 p-3">
            <Icon size={18} className={color} />
            <p className="mt-3 text-2xl font-semibold">{number}</p>
            <p className="mt-1 text-xs leading-4 text-indigo-100/60">{text}</p>
        </div>
    )
}

export default function Authentication() {

    const { pathname } = useLocation();
    const navigate = useNavigate();
    const isRegistering = pathname === "/auth/register";

    return (
        <section className="relative min-h-screen overflow-hidden bg-bg-primary">
            <aside className={`absolute inset-y-0 left-0 flex w-full items-center bg-[#11133B] px-8 text-white transition-transform duration-700 ease-in-out lg:w-1/2 lg:px-14 ${isRegistering
                ? "lg:translate-x-0" : "lg:translate-x-full"}`}
            >

                <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="w-full">
                    <div className="relative w-full max-w-xl space-y-8 mb-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
                                <Sparkles size={17} />
                                The data workspace
                            </div>

                            <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                                {isRegistering ? "Your data journey starts here." : "Better data. Better decisions."}
                            </h2>

                            <p className="max-w-md text-sm leading-6 text-indigo-100/80">
                                {isRegistering
                                    ? "Create your account and start discovering cleaner, more reliable data."
                                    : "Analyze, repair, and improve your datasets in one workspace."
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/6 p-5 shadow-2xl backdrop-blur-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-indigo-100/80">Dataset overview</p>
                                <p className="mt-1 text-xs text-white">sales_data.csv</p>
                            </div>

                            <div className="rounded-lg bg-brand/15 p-2 text-brand">
                                <FileSpreadsheet size={20} />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-indigo-200">Data quality score</p>
                                <h3 className="mt-1 text-3xl font-bold">92.8%</h3>
                            </div>

                            <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                                Excellent
                            </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-indigo-400 to-emerald-400"
                                style={{ width: "92.8%" }}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            <Card icon={FileSpreadsheet} number={12} text="Missing Values" color="text-amber-300" />
                            <Card icon={Copy} number={4} text="Duplicates" color="text-rose-300" />
                            <Card icon={Wrench} number={18} text="Repairs made" color="text-emerald-300" />
                        </div>

                        {/* Sample dataset rows */}
                        <div className="mt-6 border-t border-white/10 pt-5">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm font-medium">Recent analysis</p>
                                <span className="text-xs text-indigo-300">Preview</span>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: "Customer records", status: "Clean", color: "bg-emerald-400" },
                                    { name: "Sales transactions", status: "Repaired", color: "bg-indigo-400" },
                                    { name: "Inventory data", status: "Review needed", color: "bg-amber-400" },
                                ].map((dataset) => (
                                    <div
                                        key={dataset.name}
                                        className="flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className={`h-2 w-2 shrink-0 rounded-full ${dataset.color}`} />
                                            <span className="truncate text-indigo-100/80">
                                                {dataset.name}
                                            </span>
                                        </div>

                                        <span className="shrink-0 text-indigo-200/60">
                                            {dataset.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-indigo-200/75">Identify issues. Repair your data. Work with confidence.</p>
                </div>

            </aside>

            <div className={`absolute inset-y-0 left-0 z-10 flex w-full items-center justify-center overflow-y-auto bg-bg-primary px-5 py-8 transition-transform duration-700 ease-in-out sm:px-10 lg:w-1/2 lg:px-14 ${isRegistering
                ? "translate-x-0 lg:translate-x-full"
                : "translate-x-0 lg:translate-x-0"
                }`
            }>
                <div className="w-full max-w-md">
                    {isRegistering ? (
                        <RegisterForm />
                    ) : (
                        <LoginForm
                            onRegister={() => {
                                navigate("/auth/register");
                            }}
                        />
                    )}
                </div>
            </div>
        </section>
    )
}