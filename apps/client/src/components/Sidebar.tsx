import { NavLink } from "react-router-dom";
import { Database, X } from "lucide-react";
import { workspaces, preferences } from "../data";
import type { PagesType } from "../types";

type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};

interface PageMapType extends Omit<SidebarProps, 'isOpen'> {
    pages: PagesType[]
}

function PageMap({ pages, onClose }: PageMapType) {
    return (
        <>
            {pages.map(({ label, path, icon: Icon, end }) => (
                <NavLink key={path} to={path} end={end} onClick={onClose} className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#11133B]"
                    }`
                }>
                    {({ isActive }) => (
                        <>
                            <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                            <span>{label}</span>
                            {isActive && <span className="ml-auto h-5 w-1 rounded-full bg-indigo-600" />}
                        </>
                    )}
                </NavLink>
            ))}</>
    )
}



export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {isOpen && (
                <button type="button" aria-label="Close navigation" onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col
                border-r border-slate-200 bg-white transition-transform duration-300
                ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            >
                <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
                    <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                            <Database size={22} />
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-[#11133B]">DataCare</h1>
                            <p className="text-[11px] font-medium tracking-wide text-slate-400">DATA QUALITY PLATFORM</p>
                        </div>
                    </NavLink>

                    <button type="button" onClick={onClose} aria-label="Close sidebar"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    ><X size={20} /></button>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
                    <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
                    <PageMap pages={workspaces} onClose={onClose} />

                    <div className="!mt-8 border-t border-slate-100 pt-6">
                        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Preferences
                        </p>
                        <PageMap pages={preferences} onClose={onClose} />
                    </div>
                </nav>

                <div className="border-t border-slate-100 p-4">
                    {/* <div className="rounded-2xl bg-[#11133B] p-4 text-white">
                        <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white/10">
                            <ShieldCheck size={19} />
                        </div>

                        <p className="text-sm font-semibold">Keep your data clean</p>
                        <p className="mt-1 text-xs leading-5 text-indigo-100/70">
                            Detect issues early and maintain reliable datasets.
                        </p>
                    </div> */}

                    <p className="px-2 pb-1 pt-4 text-center text-[11px] text-slate-400">DataCare · Data quality made easier</p>
                </div>
            </aside>
        </>
    );
}
