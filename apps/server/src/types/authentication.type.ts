interface User {
    user_id: string,
    name: string,
    email: string,
    role: "user" | "admin"
}

interface UserCreated extends Omit<User, 'user_id'> {
    userId: string
}

interface Login extends Omit<User, 'user_id'> {
    userId: string
}

export type { User, UserCreated, Login }