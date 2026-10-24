import { Route, Routes } from "react-router-dom";
import Authentication from "../pages/Authentication";
import ProtectedRoutes from "../components/ProtectedRoutes";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Datasets from "../pages/Datasets";
import Dataset from "../pages/Dataset";
import Settings from "../pages/Settings";
import Issues from "../pages/Issues";

export default function RoutePage() {
    return (
        <Routes>
            <Route path="/auth/">
                <Route path="login" element={<Authentication />} />
                <Route path="register" element={<Authentication />} />
            </Route>
            <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="datasets">
                        <Route index element={<Datasets />} />
                        <Route path=":id" element={<Dataset />} />
                    </Route>
                    <Route path="issues" element={<Issues />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Route>
        </Routes>
    )
}