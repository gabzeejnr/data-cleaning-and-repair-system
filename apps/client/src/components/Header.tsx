import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { allPages } from "../data";
import { Menu, Bell, ChevronDown, UserRound, Settings2, LogOut } from "../libs";
import { useUser } from "../context/UserContext";
import type { SetStateAction } from "react";
import type { PagesType } from "../types";

type HeaderProps = {
    onMenuClick: () => void;
    setIsLoggingOut: React.Dispatch<SetStateAction<boolean>>
};

const pagesData: Omit<PagesType, "icon">[] = allPages.map(p => ({
    path: p.path,
    label: p.label,
    text: p.text,
}));

export default function DashboardHeader({ onMenuClick, setIsLoggingOut }: HeaderProps) {
    const { pathname } = useLocation();
    const { user, initials } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const currentPage = pathname.split("/").filter(Boolean).at(0) ?? "dashboard";
    const pageData = pagesData.find(page => page.path === `/${currentPage}`);
    const label = pageData?.label ?? "Dashboard";
    const text = pageData?.text ?? "Manage and monitor your data quality";


    useEffect(() => {
        function handlePointerDown(e: PointerEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setMenuOpen(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [])

    return (
        <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden">
                    <Menu size={22} />
                </button>

                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-[#11133B] sm:text-xl">{label}</h2>
                    <p className="hidden text-xs text-slate-400 sm:block">{text}</p>
                </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">
                <button type="button" aria-label="Notifications" className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#11133B]">
                    <Bell size={20} strokeWidth={1.8} />
                    <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-indigo-600" />
                </button>

                <div className="h-8 w-px bg-slate-200" />

                <div ref={menuRef} className="relative">
                    <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Open account menu" onClick={() => setMenuOpen(p => !p)}
                        className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:gap-3"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {initials || <UserRound size={18} />}
                        </span>

                        <span className="hidden min-w-0 sm:block">
                            <span className="block max-w-36 truncate text-sm font-semibold text-[#11133B]">{user?.name ?? "User"}</span>
                            <span className="mt-0.5 block max-w-36 truncate text-xs capitalize text-slate-400">{user?.role ?? "Member"}</span>
                        </span>

                        <ChevronDown size={16} className={`hidden text-slate-400 transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {menuOpen && (
                        <div role="menu" aria-label="Account menu"
                            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
                        >
                            <div className="border-b border-slate-100 px-4 py-3">
                                <p className="truncate text-sm font-semibold text-[#11133B]">{user?.name ?? "User"}</p>
                                <p className="mt-1 text-xs capitalize text-slate-500">{user?.role ?? "Member"}</p>
                            </div>

                            <div className="p-1.5">
                                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#11133B]"
                                >
                                    <UserRound size={17} className="text-slate-400" />
                                    My profile
                                </button>

                                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#11133B]"
                                >
                                    <Settings2 size={17} className="text-slate-400" />
                                    Account settings
                                </button>
                            </div>

                            <div className="border-t border-slate-100 p-1.5">
                                <button type="button" role="menuitem" onClick={() => { setIsLoggingOut(true); setMenuOpen(false) }}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                >
                                    <LogOut size={17} />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}