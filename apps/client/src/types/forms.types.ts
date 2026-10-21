import type {
    ButtonHTMLAttributes,
    Dispatch,
    InputHTMLAttributes,
    ReactNode,
    SetStateAction,
} from "react";

type ToastType = {
    type: "error" | "success",
    text: string
}

interface PasswordProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
    error?: string,
    isClosed: boolean,
    setIsClosed: Dispatch<SetStateAction<boolean>>
};

type ButtonProps = {
    type: ButtonHTMLAttributes<HTMLButtonElement>["type"],
    className?: string,
    value?: string,
    children?: ReactNode,
    disabled?: boolean
}

export type { ToastType, PasswordProps, ButtonProps }