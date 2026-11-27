import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { AUTH } from "../apis/axios";
import { themes } from "../data";
import type { Dispatch, ReactNode, SetStateAction, SubmitEvent } from "react";
import type { UserContextType } from "../types";
import { useTheme } from "../context/ThemeContext";

interface SettingsSectionProp {
    title: string;
    text: string;
    isEditing: boolean;
    setIsEditing: Dispatch<SetStateAction<boolean>>;
    setProfile?: Dispatch<SetStateAction<{ name: string; email: string }>>;
    user?: UserContextType["user"]
    children: ReactNode;
}

function SettingsSection({
    title, text, isEditing, user,
    setIsEditing, setProfile, children
}: SettingsSectionProp) {

    function editFunction() {
        if (setProfile && isEditing) setProfile({
            name: user?.name ?? "",
            email: user?.email ?? ""
        })
        setIsEditing(p => !p)
    }

    return (
        <section className="flex flex-col gap-5 sm:flex-row sm:justify-between">
            <div>
                <div className="flex items-center gap-3 sm:max-w-xs">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button type="button" onClick={editFunction}
                        className="text-sm text-brand font-medium hover:underline"
                    >{!isEditing ? "Edit" : "Cancel"}</button>
                </div>
                <p className="text-sm text-slate-500">{text}</p>
            </div>

            <div className="w-full sm:max-w-xl">
                {children}
            </div>
        </section>
    )
}


export default function Settings() {

    const navigate = useNavigate();
    const { initials, user } = useUser();
    const { theme, setTheme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<{ name: string; email: string }>({
        name: user?.name ?? "",
        email: user?.email ?? ""
    })
    const inputStyle = "w-full border border-ink/15 rounded-xl p-2 text-sm outline-none focus:border-brand transition-colors"

    function handleProfileChange(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsEditing(false);
        alert(`name: ${profile.name}\nemail:${profile.email}`);
    }

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
        <main className="space-y-15">
            <SettingsSection title="Account & Profile" isEditing={isEditing} setIsEditing={setIsEditing}
                setProfile={setProfile} text="Manage your personal information and profile details."
                user={user}
            >
                <form onSubmit={handleProfileChange} className="settings-profile flex flex-col gap-5 w-full max-w-xl">
                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-2">
                            <div className="select-none size-20 border bg-ink border-ink text-white text-4xl font-semibold rounded-full grid place-items-center">
                                {initials}
                            </div>
                            <div className="flex flex-col ">
                                <span className="font-medium">{user?.name}</span>
                                <span className="text-md">Profile Picture</span>
                            </div>
                        </div>

                        <button type="button"
                            className="text-sm p-2 bg-brand text-white font-medium px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors">Change Picture</button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="name">Full Name</label>
                        <input id="name" type="text" className={inputStyle}
                            disabled={!isEditing} value={profile.name} autoComplete="name"
                            onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" className={inputStyle}
                            disabled={!isEditing} value={profile.email} autoComplete="home email"
                            onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                        />
                    </div>

                    {isEditing && (
                        <button type="submit"
                            className="p-2 place-self-end border border-brand hover:bg-brand hover:text-white font-medium px-5 py-2 rounded-xl transition-colors"
                        >Save Changes</button>
                    )}
                </form>
            </SettingsSection>
            <SettingsSection title="Appearance" text="Customize how DataCare looks on your device."
                isEditing={false} setIsEditing={() => { }}
            >
                <div className="w-full max-w-xl grid grid-cols-3 gap-3">
                    {themes.map(option => (
                        <button key={option.value} type="button"
                            onClick={() => setTheme(option.value)}
                            className={`border rounded-xl p-3 text-left transition-colors ${theme === option.value
                                ? "border-brand bg-brand/10"
                                : "border-ink/15 hover:border-brand"
                                }`}
                        >
                            <span className="font-medium">{option.label}</span>
                            <span className="block text-xs text-slate-500 mt-1">
                                {option.description}
                            </span>
                        </button>
                    ))}
                </div>
            </SettingsSection>
            <form onSubmit={logOut}>
                <button type="submit" className="p-2 cursor-pointer bg-red-600 rounded-2xl text-white font-semibold">
                    Log Out
                </button>
            </form>
        </main>
    )
}