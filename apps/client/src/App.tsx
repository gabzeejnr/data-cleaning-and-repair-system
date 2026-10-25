import { UserProvider } from "./context/UserContext";
import RoutePage from "./routes/Route";
import "./utils";
import "./App.css";

export default function App() {
    return (
        <UserProvider>
            <RoutePage />
        </UserProvider>
    )
}