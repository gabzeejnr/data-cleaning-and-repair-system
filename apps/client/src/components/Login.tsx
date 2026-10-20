import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Database, Eye, EyeOff, ShieldCheck, FileSpreadsheet,
    Copy, Wrench, ArrowUpRight, Sparkles,
} from "lucide-react";
import { API } from "../apis/axios";
import type { UserLogin as LoginType, Login as ApiLogin } from "@data-cleaning-system/shared"
import axios from "axios";

export default function Login() {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState<boolean>(false)
    const [isClosed, setIsClosed] = useState<boolean>(true);
    const [toast, setToast] = useState<{
        type: "error" | "success",
        text: string
    } | null>(null);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setToast(null);
        setEmailError("");
        setPasswordError("");

        const formData = new FormData(e.currentTarget);

        const form: LoginType = {
            email: formData.get("email") as LoginType["email"],
            password: formData.get("password") as LoginType["password"]
        }

        try {
            const { data } = await API.post<{ message: string, data: ApiLogin }>("/auth/login", form);
            setToast({
                type: "success",
                text: `Welcome back ${data.data.name.split(" ")[0] ?? ""}`
            })

            setTimeout(() => {
                navigate("/")
            }, 1500);
        } catch (err) {
            if (axios.isAxiosError<{ error: string }>(err)) {
                const { response } = err
                setToast({
                    type: "error",
                    text: response?.data?.error || "Something went wong"
                })
            }

            setTimeout(() => {
                setToast(null);
                setEmailError("");
                setPasswordError("");
            }, 5000);
        }
    }

    return (
        <section className="grid min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
                <div className="w-full max-w-md space-y-8">
                    <header className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4F46E5]">
                            <Database size={25} color="white" />
                        </div>

                        <span className="text-2xl font-bold tracking-tight text-gray-900">DataCare</span>
                    </header>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome back
                        </h1>
                        <p className="text-sm leading-6 text-gray-500">
                            Sign in to continue cleaning your data.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        {toast && (
                            <div role="alert" aria-live="polite" className={`rounded-lg border px-4 py-3 text-sm ${toast.type === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                                }`}
                            >{toast.text}</div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>

                            <input id="email" name="email" type="email" autoComplete="email" required
                                placeholder="someone@example.com"
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                            />
                            {emailError && <p role="alert" className="text-sm -mt-1 text-red-600">{emailError}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </label>

                                <Link to="/forgot-password" className="text-sm font-medium text-[#4F46E5] hover:text-indigo-700">
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="relative">
                                <input id="password" name="password" type={isClosed ? "password" : "text"} autoComplete="current-password" required
                                    placeholder="Enter your password"
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                                />
                                {passwordError && <p role="alert" className="text-sm -mt-1 text-red-600">{passwordError}</p>}

                                <button type="button" onClick={() => setIsClosed(!isClosed)} aria-label={isClosed
                                    ? "Show password" : "Hide password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                                >
                                    {isClosed ? (<EyeOff size={19} />) : (<Eye size={19} />)}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                        >
                            Sign in
                            <ArrowUpRight size={17} />
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-[#4F46E5] hover:text-indigo-700"
                        >
                            Create one
                        </Link>
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck size={15} />
                        Your data deserves better.
                    </div>
                </div>
            </div>

            <aside className="relative hidden overflow-hidden bg-[#11133B] px-8 py-12 text-white lg:flex lg:items-center lg:justify-center xl:px-14">
                <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="relative w-full max-w-xl space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
                            <Sparkles size={17} />
                            Your data workspace
                        </div>

                        <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
                            Better data.
                            <br />
                            Better decisions.
                        </h2>

                        <p className="max-w-md text-sm leading-6 text-indigo-100/70">Analyze, repair, and improve your datasets in one workspace.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/6 p-5 shadow-2xl backdrop-blur-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold">Data quality overview</p>
                                <p className="mt-1 text-xs text-indigo-200/60">Dataset analysis preview</p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/15 text-indigo-300">
                                <FileSpreadsheet size={19} />
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-white/10 bg-white/4 p-4">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs text-indigo-200/70">Quality score</p>
                                    <p className="mt-1 text-3xl font-bold">93.8%</p>
                                </div>

                                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                                    <ArrowUpRight size={13} />
                                    Excellent
                                </span>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                <div style={{ width: "94.8%" }}
                                    className="h-full rounded-full bg-linear-to-r from-indigo-400 to-emerald-400"
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/4 p-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                                    <FileSpreadsheet size={17} />
                                </div>
                                <p className="mt-4 text-xl font-bold">12</p>
                                <p className="mt-1 text-xs leading-4 text-indigo-200/70">Missing values</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/4 p-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
                                    <Copy size={17} />
                                </div>
                                <p className="mt-4 text-xl font-bold">4</p>
                                <p className="mt-1 text-xs leading-4 text-indigo-200/70">Duplicates</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/4 p-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                                    <Wrench size={17} />
                                </div>
                                <p className="mt-4 text-xl font-bold">86</p>
                                <p className="mt-1 text-xs leading-4 text-indigo-200/70">Repairs completed</p>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                                <ShieldCheck size={18} />
                            </div>

                            <div>
                                <p className="text-xs font-medium">Data quality matters</p>
                                <p className="mt-1 text-xs text-indigo-200/60">Find issues. Fix them. Move forward.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-indigo-200/40">Authentication page concept · Illustrative metrics</p>
                </div>
            </aside>
        </section>
    )
}
