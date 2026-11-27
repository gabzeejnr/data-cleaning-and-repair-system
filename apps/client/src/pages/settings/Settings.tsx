import { useNavigate } from "react-router-dom";
import { AUTH } from "../../apis/axios";
import type { ReactNode } from "react";

function SettingsSection({ title, text, children }: { title: string; text: string; children: ReactNode }) {
    return (
        <div className="flex justify-between">
            <div>
                <h2 className="text-2xl font-medium">{title}</h2>
                <span>{text}</span>
            </div>
            <div>{children}</div>
        </div>
    )
}

export default function Settings() {

    const navigate = useNavigate()

    async function logOut(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            await AUTH.post("/logout");
            navigate("/auth/login", { replace: true })
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <main>
            <SettingsSection title="Test" text="">
                d
            </SettingsSection>
            <form onSubmit={logOut}>
                <button type="submit" className="p-2 cursor-pointer bg-red-600 rounded-2xl text-white font-semibold">
                    Log Out
                </button>
            </form>
        </main>
    )
}