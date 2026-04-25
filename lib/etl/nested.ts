import { isPlainObject } from "./flatten";

export function parsePath(path: string): (string | number)[] {
    if (!path) return [];
    return path.split(".").map((segment) => {
        const n = Number(segment);
        if (String(n) === segment && !Number.isNaN(n) && segment !== "" && /^\d+$/.test(segment)) {
            return n;
        }
        return segment;
    });
}

export function getByPath(root: unknown, path: string): unknown {
    const parts = parsePath(path);
    let cur: unknown = root;
    for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        if (Array.isArray(cur) && typeof p === "number") {
            cur = cur[p];
        } else if (isPlainObject(cur) && typeof p === "string") {
            cur = cur[p];
        } else {
            return undefined;
        }
    }
    return cur;
}

/**
 * Sets a value at a dot path, creating objects and arrays as needed.
 * Numeric segments create / index into arrays.
 */
export function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const parts = parsePath(path);
    if (parts.length === 0) return;

    let current: unknown = target;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
            if (isPlainObject(current) && (typeof part === "string" || typeof part === "number")) {
                (current as Record<string, unknown>)[String(part)] = value;
            } else if (Array.isArray(current) && typeof part === "number") {
                while (current.length <= part) {
                    (current as unknown[]).push(undefined);
                }
                (current as unknown[])[part] = value;
            }
            return;
        }

        const next = parts[i + 1];
        const needArray = typeof next === "number";
        if (isPlainObject(current) && (typeof part === "string" || typeof part === "number")) {
            const key = String(part);
            const o = current as Record<string, unknown>;
            if (o[key] === undefined) {
                o[key] = needArray ? [] : {};
            }
            current = o[key];
        } else if (Array.isArray(current) && typeof part === "number") {
            const arr = current as unknown[];
            while (arr.length <= part) {
                arr.push(needArray ? [] : {});
            }
            if (arr[part] === undefined) {
                arr[part] = needArray ? [] : {};
            }
            current = arr[part];
        } else {
            return;
        }
    }
}

export function buildObjectFromPaths(
    pairs: { path: string; value: unknown }[]
): Record<string, unknown> {
    const root: Record<string, unknown> = {};
    for (const { path, value } of pairs) {
        if (value === undefined) continue;
        setByPath(root, path, value);
    }
    return root;
}
