import type { TabularValue } from "./types";

export function isPlainObject(x: unknown): x is Record<string, unknown> {
    return x !== null && typeof x === "object" && !Array.isArray(x) && x.constructor === Object;
}

/**
 * Collect dot paths to leaf values for JSON remapping UI.
 */
export function flattenJson(
    value: unknown,
    prefix = "",
    out: { path: string; sample: string }[] = []
): { path: string; sample: string }[] {
    if (value === null || value === undefined) {
        if (prefix) out.push({ path: prefix, sample: "" });
        return out;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        if (prefix) out.push({ path: prefix, sample: String(value) });
        return out;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            if (prefix) out.push({ path: prefix, sample: "[]" });
            return out;
        }
        if (isPlainObject(value[0]) || (typeof value[0] === "object" && value[0] !== null)) {
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const p = prefix ? `${prefix}.${i}` : String(i);
                flattenJson(item, p, out);
            }
        } else {
            const sample = (value as TabularValue[]).slice(0, 5).map((v) => String(v)).join(", ");
            if (prefix) out.push({ path: prefix, sample: sample.length > 200 ? sample.slice(0, 200) + "…" : sample });
        }
        return out;
    }
    if (isPlainObject(value)) {
        for (const [k, v] of Object.entries(value)) {
            const p = prefix ? `${prefix}.${k}` : k;
            flattenJson(v, p, out);
        }
        return out;
    }
    if (prefix) out.push({ path: prefix, sample: String(value) });
    return out;
}

export function uniquePaths(rows: { path: string; sample: string }[]): { path: string; sample: string }[] {
    const seen = new Set<string>();
    return rows.filter((r) => {
        if (seen.has(r.path)) return false;
        seen.add(r.path);
        return true;
    });
}
