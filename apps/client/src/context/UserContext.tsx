import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AccessTokenPayload, User } from "@data-cleaning-system/shared";
import type { UserContextType } from "../types";
import { API } from "../apis/axios";

const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        async function getAuthenticated() {
            try {
                const { data } = await API.get<{ message: string, user: AccessTokenPayload }>("/auth/me");
                setUser(data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false);
            }
        }

        getAuthenticated();
    }, [])

    const value = { user, setUser, loading }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx
}

export { UserProvider, useUser }