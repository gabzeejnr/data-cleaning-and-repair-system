import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description: string;
    accent?: "indigo" | "emerald" | "amber" | "rose";
}

interface QuickActionProps {
    label: string,
    description: string,
    to: `/${string}`
}

export type { StatCardProps, QuickActionProps }