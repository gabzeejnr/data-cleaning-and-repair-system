import { API } from "../apis/axios";

export default function Settings() {

    async function logOut(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            await API.post("/auth/logout");
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