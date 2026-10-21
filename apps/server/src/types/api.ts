type ApiError<T = unknown> = {
    error: string
    details?: T
}

type ApiSuccess<T = unknown> = {
    message: string,
    data?: T
}

export type { ApiError, ApiSuccess }
