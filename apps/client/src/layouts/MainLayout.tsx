import { Fragment, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/Header";
import LogoutModal from "../components/LogoutModal";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    return (
        <Fragment>
            <div className="min-h-screen bg-slate-50">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="min-w-0 lg:pl-64">
                    <DashboardHeader onMenuClick={() => setSidebarOpen(true)} setIsLoggingOut={setIsLoggingOut} />

                    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
            {isLoggingOut && <LogoutModal setIsLoggingOut={setIsLoggingOut} />}
        </Fragment>
    )
}