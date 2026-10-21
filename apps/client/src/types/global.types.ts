import type { LucideIcon } from "lucide-react"

interface Header {
    label: string,
    text: string
}

interface PagesType extends Header {
    path: `/${string}`,
    icon: LucideIcon,
    end?: boolean
}


export type { PagesType }