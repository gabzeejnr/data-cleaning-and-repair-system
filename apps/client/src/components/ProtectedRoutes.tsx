import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { API } from "../apis/axios";
import loader from "../assets/svg/loader.svg";

export default function ProtectedRoutes() {

    const navigate = useNavigate();
    const [checkingAuth, setCheckingAuth] = useState<boolean>(true)

    useEffect(() => {
        getAuthenticated();
    }, [navigate]);

    async function getAuthenticated() {
        try {
            const { data } = await API.get("/auth/me");
        } catch {
            navigate("/auth/login");
        } finally {
            setCheckingAuth(false);
        }

        if (checkingAuth) return (
            <div className="h-screen grid place-items-center">
                <img src={loader} alt="Loading..." width="100" />
            </div>
        )

        return <Outlet />
    }
}