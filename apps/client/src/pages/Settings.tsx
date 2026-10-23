import { useNavigate } from "react-router-dom";
import { AUTH } from "../apis/axios";

export default function Settings() {

    const navigate = useNavigate()

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
        <form onSubmit={logOut}>
            <button type="submit" className="p-2 cursor-pointer bg-red-600 rounded-2xl text-white font-semibold">
                Log Out
            </button>
        </form>
    )
}