type ErrorType<T> = {
    ErrorType: string
    details?: T
}

type Success<T> = {
    message: string,
    data?: T
}

export type { ErrorType, Success }