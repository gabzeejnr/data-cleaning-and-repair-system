import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
    const path = pathname.split("/").filter(Boolean);
    const currentPage = (path.length === 1
        ? path.at(0)
        : path.at(1) ?? "dashboard"
    );
    const pageData = pagesData.find(page => path.length === 1 ?
        page.path === `/${currentPage}`
        : (path.length > 1 ?
            page.path === `/${path.join("/")}`
            : ""
        )
    );
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
        <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-border bg-bg-secondary px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-lg p-2 text-text-secondary transition hover:bg-bg-primary lg:hidden">
                    <Menu size={22} />
                </button>

                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-text-primary sm:text-xl">{label}</h2>
                    <p className="hidden text-xs text-text-secondary sm:block">{text}</p>
                </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">
                <button type="button" aria-label="Notifications" className="relative rounded-lg p-2.5 text-text-secondary transition hover:bg-bg-primary hover:text-text-primary">
                    <Bell size={20} strokeWidth={1.8} />
                    <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-bg-secondary bg-brand" />
                </button>

                <div className="h-8 w-px bg-border" />

                <div ref={menuRef} className="relative">
                    <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Open account menu" onClick={() => setMenuOpen(p => !p)}
                        className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:gap-3"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">
                            {initials || <UserRound size={18} />}
                        </span>

                        <span className="hidden min-w-0 sm:block">
                            <span className="block max-w-36 truncate text-sm font-semibold text-text-primary">{user?.name ?? "User"}</span>
                            <span className="mt-0.5 block max-w-36 truncate text-xs capitalize text-text-secondary">{user?.role ?? "Member"}</span>
                        </span>

                        <ChevronDown size={16} className={`hidden text-text-secondary transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {menuOpen && (
                        <div role="menu" aria-label="Account menu"
                            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-lg shadow-black/20"
                        >
                            <div className="border-b border-border px-4 py-3">
                                <p className="truncate text-sm font-semibold text-text-primary">{user?.name ?? "User"}</p>
                                <p className="mt-1 text-xs capitalize text-text-secondary">{user?.role ?? "Member"}</p>
                            </div>

                            <div className="p-1.5">
                                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-text-secondary transition hover:bg-bg-primary hover:text-text-primary"
                                >
                                    <UserRound size={17} className="text-text-secondary" />
                                    My profile
                                </button>

                                <Link to={"/settings"} type="button" role="menuitem" onClick={() => setMenuOpen(false)}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-text-secondary transition hover:bg-bg-primary hover:text-text-primary"
                                >
                                    <Settings2 size={17} className="text-text-secondary" />
                                    Account settings
                                </Link>
                            </div>

                            <div className="border-t border-border p-1.5">
                                <button type="button" role="menuitem" onClick={() => { setIsLoggingOut(true); setMenuOpen(false) }}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
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