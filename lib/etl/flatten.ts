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

const YIELD_EVERY = 2000;

function nextTick() {
    return new Promise((r) => setTimeout(r, 0));
}

type StackItem = { v: unknown; prefix: string };

/**
 * Build leaf paths like flattenJson, yielding every ~2000 **emitted** leaves so the UI stays responsive.
 */
export async function flattenJsonYielding(
    root: unknown,
    onProgress: (n: number) => void
): Promise<{ path: string; sample: string }[]> {
    const out: { path: string; sample: string }[] = [];
    const stack: StackItem[] = [{ v: root, prefix: "" }];

    const emit = async (path: string, sample: string) => {
        out.push({ path, sample });
        if (out.length % YIELD_EVERY === 0) {
            onProgress(out.length);
            // eslint-disable-next-line no-await-in-loop
            await nextTick();
        }
    };

    while (stack.length > 0) {
        const { v, prefix: p0 } = stack.pop()!;

        if (v === null || v === undefined) {
            if (p0) {
                // eslint-disable-next-line no-await-in-loop
                await emit(p0, "");
            }
        } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            if (p0) {
                // eslint-disable-next-line no-await-in-loop
                await emit(p0, String(v));
            }
        } else if (Array.isArray(v)) {
            if (v.length === 0) {
                if (p0) {
                    // eslint-disable-next-line no-await-in-loop
                    await emit(p0, "[]");
                }
            } else if (isPlainObject(v[0]) || (typeof v[0] === "object" && v[0] !== null)) {
                for (let i = v.length - 1; i >= 0; i -= 1) {
                    const p = p0 ? `${p0}.${i}` : String(i);
                    stack.push({ v: v[i], prefix: p });
                }
            } else {
                const sample = (v as TabularValue[]).slice(0, 5).map((x) => String(x)).join(", ");
                const s2 = sample.length > 200 ? sample.slice(0, 200) + "…" : sample;
                if (p0) {
                    // eslint-disable-next-line no-await-in-loop
                    await emit(p0, s2);
                }
            }
        } else if (isPlainObject(v)) {
            for (const [k, ch] of Object.entries(v)) {
                const p = p0 ? `${p0}.${k}` : k;
                stack.push({ v: ch, prefix: p });
            }
        } else {
            if (p0) {
                // eslint-disable-next-line no-await-in-loop
                await emit(p0, String(v));
            }
        }
    }
    onProgress(out.length);
    return out;
}
