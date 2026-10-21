import { useLocation } from "react-router-dom";
import { allPages } from "../data"
import { Menu, Bell, ChevronDown, UserRound } from "../libs";
import { useUser } from "../context/UserContext";
import type { PagesType } from "../types";

type HeaderProps = {
    onMenuClick: () => void;
};
const pagesData: Omit<PagesType, 'icon'>[] = allPages.map(p => ({
    path: p.path,
    label: p.label,
    text: p.text
}))

export default function DashboardHeader({ onMenuClick }: HeaderProps) {
    const { pathname } = useLocation();
    const { user } = useUser();

    const currentPage = pathname.split("/").filter(Boolean).at(0) ?? "dashboard";
    const pageData = pagesData.find(page => page.path === `/${currentPage}`);
    const label = pageData?.label ?? "Dashboard";
    const text = pageData?.text ?? "Manage and monitor your data quality"

    const initials = (user?.name
        ?.trim().split(/\s+/)
        .slice(0, 2).map(p => p[0])
        .join("").toUpperCase()
    ) || "U"

    return (
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={onMenuClick} aria-label="Open navigation"
                    className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                ><Menu size={22} /></button>

                <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold tracking-tight text-[#11133B] sm:text-xl">{label}</h2>
                    <p className="hidden text-xs text-slate-400 sm:block">{text}</p>
                </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">
                <button type="button" aria-label="Notifications" className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#11133B]">
                    <Bell size={20} strokeWidth={1.8} />
                    <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-indigo-600" />
                </button>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
                        {initials || <UserRound size={18} />}
                    </div>

                    <div className="hidden min-w-0 sm:block">
                        <p className="max-w-36 truncate text-sm font-semibold text-[#11133B]">
                            {user?.name ?? "User"}
                        </p>
                        <p className="max-w-36 truncate text-xs capitalize text-slate-400">
                            {user?.role ?? "Member"}
                        </p>
                    </div>

                    <button type="button">
                        <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
                    </button>
                </div>
            </div>
        </header>
    );
}
