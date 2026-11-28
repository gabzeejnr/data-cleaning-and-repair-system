import { Link } from "react-router-dom";

export default function ForgotPassword() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-bg-primary px-5">
            <section className="w-full max-w-md space-y-4 rounded-xl bg-bg-secondary p-8">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Password reset</h1>
                <p className="text-sm leading-6 text-text-secondary">
                    Password reset is not available yet. Please contact your administrator for help accessing your account.
                </p>
                <Link
                    to="/auth/login"
                    className="inline-block font-semibold text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                >
                    Back to sign in
                </Link>
            </section>
        </main>
    );
}
