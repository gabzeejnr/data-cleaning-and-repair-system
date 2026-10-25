import type { ProposedChange, ReviewStatus } from "../types/repairs.types";
export type GroupKind = "value" | "duplicate" | "review";

export interface ChangeGroup {
    key: string;
    kind: GroupKind;
    title: string;
    subtitle: string;
    changes: ProposedChange[];
}

const humanize = (text: string) => text.replaceAll("_", " ");


function changeKind(change: ProposedChange): GroupKind {
    if (change.type === "outlier_review") return "review";
    if (change.type === "exact_duplicate_removal") return "duplicate";
    return "value";
}

function isApplyable(change: ProposedChange) {
    return changeKind(change) !== "review";
}


function groupChanges(changes: ProposedChange[]): ChangeGroup[] {
    const groups = new Map<string, ChangeGroup>();

    for (const change of changes) {
        const kind = changeKind(change);
        const key = kind === "value" ? `${change.type}:${change.column}` : kind;

        let group = groups.get(key);
        if (!group) {
            group = {
                key, kind,
                title: (kind === "value"
                    ? (change.column ?? "Unnamed column")
                    : (kind === "duplicate"
                        ? "Duplicate rows"
                        : "Unusual rows"
                    )
                ),
                subtitle: (kind === "value"
                    ? humanize(change.type)
                    : (kind === "duplicate"
                        ? "Exact copies, removed only when approved"
                        : "Review only. Nothing is changed automatically."
                    )
                ),
                changes: [],
            }
            groups.set(key, group);
        }
        group.changes.push(change);
    }

    const order: Record<GroupKind, number> = { value: 0, duplicate: 1, review: 2 };
    return [...groups.values()].sort((a, b) => order[a.kind] - order[b.kind]);
}

function summarize(changes: ProposedChange[], decisions: Record<string, ReviewStatus>) {
    const applyable = changes.filter(isApplyable);
    return {
        applyable: applyable.length,
        approved: applyable.filter(c => decisions[c.id] === "accepted").length,
        rejected: applyable.filter(c => decisions[c.id] === "rejected").length,
        reviewed: changes.filter(c => !isApplyable(c) && decisions[c.id] === "accepted").length,
        pending: applyable.filter(c => (decisions[c.id] ?? "pending") === "pending").length,
    };
}

export { changeKind, groupChanges, isApplyable, summarize }