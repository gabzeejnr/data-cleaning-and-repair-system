import { createContext, useContext, useEffect, useState } from "react";
import { AUTH } from "../apis/axios";
import type { AccessTokenPayload, User } from "@data-cleaning-system/shared";
import type { UserContextType } from "../types";
import type { ReactNode } from "react";

const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const initials = (user?.name
        ?.trim().split(/\s+/)
        .slice(0, 2).map(p => p[0])
        .join("").toUpperCase()
    ) || "U";

    useEffect(() => {
        async function getAuthenticated() {
            try {
                const { data } = await AUTH.get<{ message: string, user: AccessTokenPayload }>("/me");
                setUser(data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false);
            }
        }

        getAuthenticated();
    }, [])

    async function logOut() {
        try {
            await AUTH.post("/logout");
            setUser(null)
        } catch (err) {
            console.log(err);
        }
    }

    const value = {
        user,
        setUser,
        loading,
        initials,
        logOut
    }

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