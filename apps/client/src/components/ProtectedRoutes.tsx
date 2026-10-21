import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import loader from "../assets/svg/loader.svg";

export default function ProtectedRoutes() {

    const { user, loading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) navigate("/auth/login", { replace: true });
    }, [loading, user, navigate]);

    if (loading || !user) return (
        <div className="h-screen grid place-items-center">
            <img src={loader} alt="Loading..." width="100" />
        </div>
    )


    return <Outlet />
}