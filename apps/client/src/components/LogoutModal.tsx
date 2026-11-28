import { LogOut } from "../libs";
import { useUser } from "../context/UserContext";
import type { SetStateAction } from "react";

export default function LogoutModal({ setIsLoggingOut }: { setIsLoggingOut: React.Dispatch<SetStateAction<boolean>> }) {

    const { initials, user, logOut } = useUser();
    const fullName = user?.name;

    async function handleLogOut() {
        await logOut();
    }

    return (
        <div className="fixed inset-0 z-100 flex h-full items-center justify-center overflow-hidden bg-black/50">
            <div role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description"
                className="w-full max-w-100 rounded-xl border border-border bg-bg-secondary p-6 shadow-2xl shadow-black/20"
            >
                <div className="grid size-11 place-items-center rounded-xl border border-danger/20 bg-danger/10">
                    <LogOut size={20} strokeWidth={1.8} className="text-danger" />
                </div>

                <h2 id="logout-title" className="mt-5 text-xl font-semibold tracking-tight text-text-primary">Sign out of DataCare?</h2>

                <p id="logout-description" className="mt-2 text-sm leading-6 text-text-secondary">
                    You're about to end your current session. You'll need to sign in again to access your workspace.
                </p>

                <div className="my-5 border-t border-border" />

                <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-bg-primary p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand/20 bg-brand-soft text-sm font-semibold text-brand">{initials || "U"}</span>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">{fullName || "Current account"}</p>
                        <p className="mt-1 text-xs text-text-secondary">Signed-in account</p>
                    </div>

                    <span className="size-2 shrink-0 rounded-full bg-success" />
                </div>

                <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => setIsLoggingOut(false)}
                        className="min-h-11 flex-1 rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >Cancel</button>

                    <button type="button" onClick={handleLogOut}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger ring-1 ring-danger/30 transition hover:bg-danger/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}