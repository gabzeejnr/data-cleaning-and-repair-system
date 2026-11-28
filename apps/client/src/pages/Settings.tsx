import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { AUTH } from "../apis/axios";
import { themes } from "../data";
import type { Dispatch, ReactNode, SetStateAction, SubmitEvent } from "react";
import type { UserContextType } from "../types";

interface SettingsSectionProp {
    title: string;
    text: string;
    canEdit: boolean;
    isEditing?: boolean;
    setIsEditing?: Dispatch<SetStateAction<boolean>>;
    setProfile?: Dispatch<SetStateAction<{ name: string; email: string }>>;
    user?: UserContextType["user"];
    children: ReactNode;
}

function SettingsSection({
    title, text, isEditing, user, canEdit,
    setIsEditing, setProfile, children
}: SettingsSectionProp) {

    function editFunction() {
        if (setProfile && isEditing) setProfile({
            name: user?.name ?? "",
            email: user?.email ?? ""
        })
        if (canEdit && setIsEditing !== undefined) setIsEditing(p => !p);
    }

    return (
        <section className="flex flex-col gap-5 sm:flex-row sm:justify-between">
            <div>
                <div className="flex items-center gap-3 sm:max-w-xs">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {canEdit && (
                        <button type="button" onClick={editFunction}
                            className="text-sm text-brand font-medium hover:underline"
                        >{!isEditing ? "Edit" : "Cancel"}</button>
                    )}
                </div>
                <p className="text-sm text-text-secondary">{text}</p>
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
    const inputStyle = `w-full border ${isEditing ? "border-brand" : "border-border"} rounded-xl bg-bg-secondary p-2 text-sm text-text-primary outline-none transition-colors focus:border-brand disabled:bg-bg-primary`

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
            <SettingsSection title="Account & Profile" canEdit={true} isEditing={isEditing} setIsEditing={setIsEditing}
                setProfile={setProfile} text="Manage your personal information and profile details."
                user={user}
            >
                <form onSubmit={handleProfileChange} className="settings-profile flex flex-col gap-5 w-full max-w-xl">
                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-2">
                            <div className="select-none size-20 border border-brand/20 bg-brand-soft text-brand text-4xl font-semibold rounded-full grid place-items-center">
                                {initials}
                            </div>
                            <div className="flex flex-col ">
                                <span className="font-medium">{user?.name}</span>
                                <span className="text-md text-text-secondary">Profile Picture</span>
                            </div>
                        </div>

                        <button type="button"
                            className="text-sm p-2 bg-brand text-white font-medium px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors">Change Picture</button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-medium text-text-secondary">Full Name</label>
                        <input id="name" type="text" className={inputStyle}
                            disabled={!isEditing} value={profile.name} autoComplete="name"
                            onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email</label>
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
            <SettingsSection title="Appearance" canEdit={false} text="Customize how DataCare looks on your device.">
                <div className="w-full max-w-xl grid grid-cols-3 gap-3">
                    {themes.map(option => (
                        <button key={option.value} type="button"
                            onClick={() => setTheme(option.value)}
                            className={`border rounded-xl p-3 text-left transition-colors ${theme === option.value
                                ? "border-brand bg-brand/10"
                                : "border-border hover:border-brand"
                                }`}
                        >
                            <span className="font-medium text-text-primary">{option.label}</span>
                            <span className="mt-1 block text-xs text-text-secondary">
                                {option.description}
                            </span>
                        </button>
                    ))}
                </div>
            </SettingsSection>
            <form onSubmit={logOut}>
                <button type="submit" className="cursor-pointer rounded-2xl bg-danger/10 px-5 py-2 font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/20">
                    Log Out
                </button>
            </form>
        </main>
    )
}