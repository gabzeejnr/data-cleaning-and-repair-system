export default function Table({ headers }: { headers: string[] }) {
    return (
        <>
            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        {headers.map(head => <th className="px-6 py-4">{head.capitalize()}</th>)}
                    </tr>
                </thead>
            </table>
        </>
    )
}