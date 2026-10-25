import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "../libs";

export default function PageHeader({ title, subtitle, back, backLink = "/", backText = "Back", children }: {
    title: string;
    subtitle: string;
    back?: boolean;
    backLink?: `/${string}`;
    backText?: string;
    children?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                {back && (
                    <Link to={backLink} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
                        <ArrowLeft size={16} />
                        {backText}
                    </Link>
                )}

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </header>
    )
}