import { UserProvider } from "./context/UserContext";
import RoutePage from "./routes/Route";
import "./utils/string.utils";
import "./App.css";

export default function App() {
    return (
        <UserProvider>
            <RoutePage />
        </UserProvider>
    )
}