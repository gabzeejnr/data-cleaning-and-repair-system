import { UserProvider } from "./context/UserContext";
import RoutePage from "./routes/Route";
import "./utils";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
    return (
        <UserProvider>
            <ThemeProvider>
                <RoutePage />
            </ThemeProvider>
        </UserProvider>
    )
}