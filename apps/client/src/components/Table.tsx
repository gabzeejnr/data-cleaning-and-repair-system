export default function Table({ headers }: { headers: string[] }) {
    return (
        <>
            <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-primary text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                        {headers.map(head => <th className="px-6 py-4">{head.capitalize()}</th>)}
                    </tr>
                </thead>
            </table>
        </>
    )
}