import type { ToastType } from "../types/forms.types";

function Toast({ toast }: { toast: ToastType | null }) {
    return (
        toast && (
            <div role="alert" aria-live="polite" className={`rounded-lg border px-4 py-3 text-sm ${toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
                }`}
            >{toast.text}</div>
        )
    )
}


export { Toast }