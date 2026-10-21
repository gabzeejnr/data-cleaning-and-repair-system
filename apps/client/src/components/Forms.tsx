import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../apis/axios";
import { Toast } from "./Toast";
import { ArrowLeft, ArrowUpRight, Database, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import type { User, UserLogin, UserRegistration } from "@data-cleaning-system/shared";
import type { ToastType, PasswordProps, ButtonProps } from "../types";


function Password({ label, error, isClosed = true, setIsClosed, ...props }: PasswordProps) {

    return (
        <div className="space-y-2">
            <label htmlFor={props.id ?? "password"} className="text-sm font-medium text-gray-700">{label}</label>

            <div className="relative">
                <input {...props} id={props.id ?? "password"} name={props.name ?? "password"}
                    type={isClosed ? "password" : "text"} autoComplete={props.autoComplete ?? "current-password"} required={props.required ?? true}
                    placeholder={props.placeholder ?? "Enter your password"}
                    className={`w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 ${error ? "border-red-500" : ""
                        }`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${props.id ?? "password"}-error` : undefined}
                />

                <button type="button" onClick={() => setIsClosed((prev) => !prev)}
                    aria-label={isClosed ? "Show password" : "Hide password"} aria-pressed={!isClosed}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                >{isClosed
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                    }
                </button>
            </div>

            {error && (
                <p id={`${props.id ?? "password"}-error`} role="alert" className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}

function FormButton({ type, className, value, children, disabled }: ButtonProps) {
    return (
        <button type={type} className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] py-3 text-sm font-semibold text-white shadow-sm
            transition-colors duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:hover:bg-gray-300${className}`} disabled={disabled}
        >
            {value ?? children}
        </button>
    )
}


function LoginForm({ onRegister }: { onRegister: React.MouseEventHandler<HTMLAnchorElement> }) {

    const navigate = useNavigate();
    const [toast, setToast] = useState<ToastType | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [isClosed, setIsClosed] = useState<boolean>(true);

    async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setToast(null);
        setEmailError("");
        setPasswordError("");

        const formData = new FormData(e.currentTarget);

        const form: UserLogin = {
            email: formData.get("email") as UserLogin["email"],
            password: formData.get("password") as UserLogin["password"]
        }

        try {
            const { data } = await API.post<{ message: string, data: User }>("/auth/login", form);
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
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
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
                    <Toast toast={toast} />

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
                    <FormButton type="submit" disabled={loading}>
                        Sign in<ArrowUpRight size={17} />
                    </FormButton>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link to={"/auth/register"} className="font-semibold text-[#4F46E5] hover:text-indigo-700"
                        onClick={onRegister}>
                        Create one
                    </Link>
                </p>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck size={15} />
                    Your data deserves better.
                </div>
            </div>
        </div>
    )
}

function RegisterForm({ onBack }: { onBack: React.MouseEventHandler<HTMLButtonElement> }) {
    const [toast, setToast] = useState<ToastType | null>(null);
    const [isClosed, setIsClosed] = useState(true);
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string>("");
    const [form, setData] = useState<UserRegistration>({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })

    async function handleRegister(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setToast(null);
        setPasswordError("");
        setLoading(true);

        if (form.password !== form.confirmPassword) {
            setToast({
                type: "error",
                text: "Passwords do not match.",
            })
            return;
        }

        try {
            await API.post("/auth/register", form);

            setToast({
                type: "success",
                text: "User registered successfully."
            })
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
                setPasswordError("");
            }, 5000);
        }
    }

    useEffect(() => {
        form.password && form.confirmPassword && (form.password !== form.confirmPassword) && setPasswordError("Passwords do not match.");
        (form.password && form.password.length < 8) && setPasswordError("Password mut be at least 8 characters.")
    }, [form.password, form.confirmPassword])

    const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100";

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#4F46E5]">
                    <ArrowLeft size={16} />
                    Back to sign in
                </button>

                <div className="flex items-center gap-2 text-[#4F46E5]">
                    <UserPlus size={21} />
                    <span className="text-sm font-semibold">Create your account</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Get started with DataCare</h1>

                <p className="text-sm leading-6 text-gray-500">Create an account to upload, analyze, and repair your datasets in one place.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
                <Toast toast={toast} />

                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>

                    <input id="name" name="name" type="text" autoComplete="name" required
                        minLength={2} placeholder="John Doe" className={inputClass}
                        value={form.name} onChange={(e) => setData(p => ({ ...p, name: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>

                    <input id="email" name="email" type="email" autoComplete="email"
                        required placeholder="someone@example.com" className={inputClass}
                        value={form.email} onChange={(e) => setData(p => ({ ...p, email: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <Password label="Password" name="password" isClosed={isClosed} setIsClosed={setIsClosed}
                        value={form.password} onChange={(e) => setData(p => ({ ...p, password: e.target.value }))}
                        error={passwordError}
                    />
                </div>

                <div className="space-y-2">
                    <Password label="Confirm Password" name="confirmPassword" isClosed={isClosed} setIsClosed={setIsClosed}
                        value={form.confirmPassword} onChange={(e) => setData(p => ({ ...p, confirmPassword: e.target.value }))}
                    />
                </div>

                <p className="text-xs leading-5 text-gray-500">
                    By creating an account, you agree to use DataCare responsibly and provide accurate account information.
                </p>

                <FormButton type="submit" disabled={loading}>
                    Create account
                    <UserPlus size={17} />
                </FormButton>
            </form>

            <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-semibold text-[#4F46E5] hover:text-indigo-700">Sign in</Link>
            </p>
        </div>
    )
}



export { LoginForm, RegisterForm }