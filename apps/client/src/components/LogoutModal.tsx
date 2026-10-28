import { LogOut } from "../libs";
import { useUser } from "../context/UserContext";
import type { SetStateAction } from "react";

type ModalProps = {
    onCancel?: () => void;
    setIsLoggingOut: React.Dispatch<SetStateAction<boolean>>
}

export default function LogoutModal({ onCancel, setIsLoggingOut }: ModalProps) {

    const { initials, user, logOut } = useUser();
    const fullName = user?.name;

    async function handleLogOut() {
        await logOut();
    }

    return (
        <div className="fixed h-full inset-0 z-100 flex items-center justify-center bg-[#00000010] overflow-hidden">
            <div role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description"
                className="w-full max-w-100 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10"
            >
                <div className="grid size-11 place-items-center rounded-xl border border-rose-100 bg-rose-50">
                    <LogOut size={20} strokeWidth={1.8} className="text-rose-600" />
                </div>

                <h2 id="logout-title" className="mt-5 text-xl font-semibold tracking-tight text-[#11133B]">Sign out of DataCare?</h2>

                <p id="logout-description" className="mt-2 text-sm leading-6 text-slate-500">
                    You're about to end your current session. You'll need to sign in again to access your workspace.
                </p>

                <div className="my-5 border-t border-slate-200" />

                <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700">{initials || "U"}</span>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#11133B]">{fullName || "Current account"}</p>
                        <p className="mt-1 text-xs text-slate-500">Signed-in account</p>
                    </div>

                    <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                </div>

                <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => setIsLoggingOut(false)}
                        className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >Cancel</button>

                    <button type="button" onClick={handleLogOut}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}