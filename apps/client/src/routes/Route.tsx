import { Route, Routes } from "react-router-dom";
import Login from "../components/Login";
import ProtectedRoutes from "../components/ProtectedRoutes";

export default function RoutePage() {
    return (
        <Routes>
            <Route path="/auth/">
                <Route path="login" element={<Login />} />
            </Route>
            <Route element={<ProtectedRoutes />}>
                <Route path="/">
                    <Route index />
                </Route>
            </Route>
        </Routes>
    )
}