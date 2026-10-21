import { UserProvider } from "./context/UserContext";
import RoutePage from "./routes/Route";
import "./App.css";

export default function App() {
    return (
        <UserProvider>
            <RoutePage />
        </UserProvider>
    )
}