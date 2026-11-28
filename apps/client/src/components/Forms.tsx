import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { AUTH } from "../apis/axios";
import { Toast } from "./Toast";
import { ArrowUpRight, Database, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import type { User, UserLogin, UserRegistration } from "@data-cleaning-system/shared";
import type { ToastType, PasswordProps, ButtonProps } from "../types";

const inputClass = "w-full rounded-lg border border-gray-200 bg-bg-secondary px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-100";

function Password({ label, error, isClosed = true, setIsClosed, ...props }: PasswordProps) {
    const inputId = props.id ?? props.name ?? "password";

    return (
        <div className="space-y-4">
            <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">{label}</label>

            <div className="relative mt-1">
                <input {...props} id={inputId} name={props.name ?? "password"}
                    type={isClosed ? "password" : "text"} autoComplete={props.autoComplete ?? "new-password"} required={props.required ?? true}
                    placeholder={props.placeholder ?? "Enter your password"}
                    className={`${inputClass} pr-12 ${error ? "border-red-500" : ""
                        }`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                />

                <button type="button" onClick={() => setIsClosed((prev) => !prev)}
                    aria-label={isClosed ? "Show password" : "Hide password"} aria-pressed={!isClosed}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
                >{isClosed
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                    }
                </button>
            </div>

            {error && (
                <p id={`${inputId}-error`} role="alert" className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}

function FormButton({ type, className, value, children, disabled }: ButtonProps) {
    return (
        <button type={type} className={`flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm
            transition-colors duration-200 hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg-primary
            disabled:cursor-not-allowed disabled:bg-bg-primary disabled:text-text-secondary disabled:shadow-none disabled:hover:bg-bg-primary ${className ?? ""}`} disabled={disabled}
        >
            {value ?? children}
        </button>
    )
}


function LoginForm({ onRegister }: { onRegister: React.MouseEventHandler<HTMLAnchorElement> }) {

    const navigate = useNavigate();
    const { setUser } = useUser();
    const [toast, setToast] = useState<ToastType | null>(null);
    const [loading, setLoading] = useState(false);
    const [isClosed, setIsClosed] = useState<boolean>(true);

    async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setToast(null);

        const formData = new FormData(e.currentTarget);

        const form: UserLogin = {
            email: formData.get("email") as UserLogin["email"],
            password: formData.get("password") as UserLogin["password"]
        }

        try {
            const { data } = await AUTH.post<{ message: string, data: User }>("/login", form);
            setUser(data.data);
            setToast({
                type: "success",
                text: `Welcome back ${data.data.name.trim().split(/\s+/)[0] ?? ""}`
            })

            setTimeout(() => {
                navigate("/", { replace: true })
            }, 1500);
        } catch (err) {
            if (axios.isAxiosError<{ error: string }>(err)) {
                const { response } = err
                setToast({
                    type: "error",
                    text: response?.data?.error || "Something went wrong. Please try again."
                })
            } else {
                setToast({
                    type: "error",
                    text: "Something went wrong. Please try again."
                })
            }

            setTimeout(() => {
                setToast(null);
            }, 5000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="w-full max-w-md space-y-8">
                <header className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand">
                        <Database size={25} color="white" />
                    </div>

                    <span className="text-2xl font-bold tracking-tight text-text-primary">DataCare</span>
                </header>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                        Welcome back
                    </h1>
                    <p className="text-sm leading-6 text-text-secondary">
                        Sign in to continue cleaning your data.
                    </p>
                </div>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <Toast toast={toast} />

                    <div className="space-y-2">
                        <label htmlFor="email" className=" text-text-secondary block text-sm font-medium">
                            Email address
                        </label>

                        <input id="email" name="email" type="email" autoComplete="email" required
                            placeholder="someone@example.com"
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="password" className=" text-text-secondary text-sm font-medium">
                                Password
                            </label>

                            <Link to="/forgot-password" className="text-sm font-medium text-text-secondary underline-offset-4 hover:text-text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <div className="relative">
                            <input id="password" name="password" type={isClosed ? "password" : "text"} autoComplete="current-password" required
                                placeholder="Enter your password"
                                className={`${inputClass} pr-12`}
                            />

                            <button type="button" onClick={() => setIsClosed(!isClosed)} aria-label={isClosed
                                ? "Show password" : "Hide password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
                            >
                                {isClosed ? (<EyeOff size={19} />) : (<Eye size={19} />)}
                            </button>
                        </div>
                    </div>
                    <FormButton type="submit" disabled={loading}>
                        Sign in<ArrowUpRight size={17} />
                    </FormButton>
                </form>

                <p className="text-center text-sm text-text-secondary">
                    Don't have an account?{" "}
                    <Link to={"/auth/register"} className="font-semibold text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                        onClick={onRegister}>
                        Create one
                    </Link>
                </p>

                <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
                    <ShieldCheck size={15} />
                    Your data deserves better.
                </div>
            </div>
        </div>
    )
}

function RegisterForm() {
    const navigate = useNavigate();
    const { setUser } = useUser();
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
            setLoading(false);
            setToast({
                type: "error",
                text: "Passwords do not match.",
            });

            return;
        }

        try {
            const { data } = await AUTH.post<{ message: string, data: User }>("/register", form);
            setUser(data.data);

            setToast({
                type: "success",
                text: `Welcome ${data.data.name.trim().split(/\s+/)[0] ?? ""}`
            })

            setTimeout(() => {
                navigate("/", { replace: true })
            }, 1500);
        } catch (err) {
            if (axios.isAxiosError<{ error: string }>(err)) {
                const { response } = err
                setToast({
                    type: "error",
                    text: response?.data?.error || "Something went wrong. Please try again."
                })
            } else {
                setToast({
                    type: "error",
                    text: "Something went wrong. Please try again."
                })
            }

            setTimeout(() => {
                setToast(null);
                setPasswordError("");
            }, 5000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">

                <div className="flex items-center gap-2 text-brand">
                    <UserPlus size={21} />
                    <span className="text-sm font-semibold">Create your account</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Get started with DataCare</h1>

                <p className="text-sm leading-6 text-text-secondary">Create an account to upload, analyze, and repair your datasets in one place.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
                <Toast toast={toast} />

                <div className="space-y-2">
                    <label htmlFor="name" className=" text-text-secondary block text-sm font-medium">Full name</label>

                    <input id="name" name="name" type="text" autoComplete="name" required
                        minLength={2} placeholder="John Doe" className={inputClass}
                        value={form.name} onChange={(e) => setData(p => ({ ...p, name: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className=" text-text-secondary block text-sm font-medium">Email address</label>

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

                <p className="text-xs leading-5 text-text-secondary">
                    By creating an account, you agree to use DataCare responsibly and provide accurate account information.
                </p>

                <FormButton type="submit" disabled={loading}>
                    Create account
                    <UserPlus size={17} />
                </FormButton>
            </form>

            <p className="text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-semibold text-text-secondary underline-offset-4 hover:text-text-primary hover:underline">Sign in</Link>
            </p>
        </div>
    )
}



export { LoginForm, RegisterForm }