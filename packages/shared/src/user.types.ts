type UserRole = "user" | "admin"

interface User {
    userId: string,
    name: string,
    email: string,
    role: UserRole
}

interface UserLogin {
    email: string,
    password: string
}

interface UserRegistration {
    name: string,
    email: string,
    password: string,
    confirmPassword: string
}

interface AccessTokenPayload extends User {
    purpose: "access"
}

export type {
    User, UserLogin, UserRole, AccessTokenPayload,
    UserRegistration
}