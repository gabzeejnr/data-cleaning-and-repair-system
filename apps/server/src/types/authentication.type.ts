interface User {
    user_id: string,
    name: string,
    email: string,
    role: "user" | "admin",
    password?: string
}

interface UserCreated extends Omit<User, 'user_id'> {
    userId: string
}

interface Login extends Omit<User, 'user_id'> {
    userId: string
}

interface AccessTokenPayload extends Omit<User, 'password'> {
    purpose: "access"
}

export type { User, UserCreated, Login, AccessTokenPayload }