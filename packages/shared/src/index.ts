interface User {
    user_id: string,
    name: string,
    email: string,
    role: "user" | "admin",
    password?: string
}

interface Login extends Omit<User, 'user_id'> {
    userId: string
}

interface UserLogin {
    email: string,
    password: string
}

export type { Login, User, UserLogin }