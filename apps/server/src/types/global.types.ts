type Error<T> = {
    error: string
    details?: T
}

type Success<T> = {
    message: string,
    data?: T
}

export type { Error, Success }