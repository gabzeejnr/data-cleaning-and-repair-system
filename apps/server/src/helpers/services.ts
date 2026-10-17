import { isNumber } from "../libs/service.libs.js";
import { parseNumericValue } from "../utils/index.js";
import type { ColumnProfile, Outliers } from "../types/dataset.type.js";

function isMissing(value: unknown): boolean {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
}

function detectDataType(values: unknown[]): ColumnProfile["dataType"] {
    const presentValues = values.filter(value => !isMissing(value));

    if (presentValues.length === 0) return "empty";

    const types = new Set(
        presentValues.map((value) => {
            if (typeof value === "boolean") return "boolean";
            if (isNumber(value)) {
                return "number";
            }
            return "text";
        }),
    );

    if (types.size > 1) return "mixed";

    return Array.from(types)[0] as ColumnProfile["dataType"]
}

function calculateQuartiles(values: unknown[]): { Q1: number, Q3: number } | null {

    if (!values || values.length === 0) return null;

    const n = values.flatMap(value => {
        const n = parseNumericValue(value);
        return n !== null ? [n] : []
    }).sort((a, b) => a - b);

    const length = n.length;
    if (length === 0) return null;
    if (length === 1) {
        if (n[0] === undefined) return null;
        return { Q1: n[0], Q3: n[0] }
    }

    let lowerHalf: number[] = [];
    let upperHalf: number[] = [];

    if (length % 2 !== 0) {
        lowerHalf.push(...n.slice(0, Math.floor(length / 2)));
        upperHalf.push(...n.slice(Math.ceil(length / 2)))
    } else {
        lowerHalf.push(...n.slice(0, length / 2));
        upperHalf.push(...n.slice((length / 2)))
    }


    const halfLength = lowerHalf.length;
    let Q1: number;
    let Q3: number;

    if (halfLength % 2 !== 0) {
        Q1 = lowerHalf[Math.floor(halfLength / 2)]!;
        Q3 = upperHalf[Math.floor(halfLength / 2)]!;
    } else {
        Q1 = (lowerHalf[(halfLength / 2) - 1]! + lowerHalf[halfLength / 2]!) / 2;
        Q3 = (upperHalf[(halfLength / 2) - 1]! + upperHalf[halfLength / 2]!) / 2;
    }

    return { Q1, Q3 }
}

function detectOutliers(values: unknown[]): Outliers | null {

    const qs = calculateQuartiles(values);
    if (qs === null) return null;

    const { Q1, Q3 } = qs;

    const IQR = Q3 - Q1;
    const lowerBound = Q1 - (1.5 * IQR);
    const upperBound = Q3 + (1.5 * IQR);

    const outliers = values.filter(value => {
        const n = Number(value);

        if (value === null
            || value === undefined
            || String(value).trim() === ""
            || !Number.isFinite(n)
        ) {
            return false;
        }

        const i = n < lowerBound || n > upperBound;

        return i
    })

    return {
        Q1,
        Q3,
        IQR,
        lowerBound,
        upperBound,
        outliers
    }
}

export {
    calculateQuartiles, detectDataType, detectOutliers, isMissing
}