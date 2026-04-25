import { getByPath } from "./nested";

// jexl is CommonJS; custom instance for our transforms
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Jexl: JexlClass } = require("jexl") as {
    Jexl: new () => {
        addTransform: (n: string, fn: (v: unknown, ...a: unknown[]) => unknown) => void;
        addFunction: (n: string, fn: (...a: unknown[]) => unknown) => void;
        evalSync: (e: string, c?: object) => unknown;
    };
};

const engine = new JexlClass();
engine.addTransform("upper", (s: unknown) => (typeof s === "string" ? s.toUpperCase() : s));
engine.addTransform("lower", (s: unknown) => (typeof s === "string" ? s.toLowerCase() : s));
engine.addTransform("trim", (s: unknown) => (typeof s === "string" ? s.trim() : s));
engine.addTransform("len", (s: unknown) => (typeof s === "string" ? s.length : Array.isArray(s) ? s.length : 0));
engine.addTransform("toNumber", (s: unknown) => {
    if (typeof s === "number" && !Number.isNaN(s)) return s;
    if (typeof s === "boolean") return s ? 1 : 0;
    if (s == null) return 0;
    const n = Number(String(s).replace(/[,$\s%]/g, "").trim());
    return Number.isFinite(n) ? n : 0;
});
engine.addTransform("int", (s: unknown) => {
    if (typeof s === "number") return Math.trunc(s);
    if (s == null) return 0;
    const n = parseInt(String(s).replace(/[,$\s%]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
});
engine.addTransform("default", (a: unknown, b?: unknown) => (a == null || a === "" ? b : a));
engine.addTransform("replace", (s: unknown, from?: unknown, to?: unknown) => {
    if (typeof s !== "string") return s;
    return s.split(String(from)).join(String(to));
});
engine.addFunction("at", (obj: unknown, path?: unknown) => (obj == null ? undefined : getByPath(obj, String(path))));
engine.addFunction("isEmpty", (v?: unknown) => v == null || (typeof v === "string" && v.trim() === ""));
engine.addFunction("isBlank", (v?: unknown) => v == null || (typeof v === "string" && v.trim() === ""));
engine.addFunction("isNum", (v?: unknown) => {
    if (typeof v === "number") return !Number.isNaN(v);
    if (v == null) return false;
    return !Number.isNaN(Number(String(v).replace(/[,$\s%]/g, "")));
});

function rowGetter(row: Record<string, unknown>, key: string, caseSensitive: boolean): unknown {
    if (key in row) return row[key];
    if (caseSensitive) return row[key];
    for (const rk of Object.keys(row)) {
        if (rk.toLowerCase() === key.toLowerCase()) return row[rk];
    }
    return undefined;
}

function createRowProxy(
    rowPlain: Record<string, unknown>,
    caseSensitive: boolean
): Record<string, unknown> {
    return new Proxy(rowPlain, {
        get(r, p: string | symbol) {
            if (p === "then" || p === "constructor" || p === "prototype") return undefined;
            if (typeof p === "string") {
                return rowGetter(r, p, caseSensitive) ?? (r as Record<string, unknown>)[p];
            }
            return undefined;
        },
    }) as Record<string, unknown>;
}

export function evalTableTransformToValue(
    transform: string,
    value: unknown,
    _sourceField: string,
    row: Record<string, unknown>,
    rowIndex: number,
    caseSensitive: boolean
): unknown {
    const t = transform.trim();
    if (!t) return value;
    const c = createRowProxy(row, caseSensitive);
    return engine.evalSync(t, {
        value,
        v: value,
        row: c,
        c,
        rowIndex,
        i: rowIndex,
        col: (name?: unknown) => rowGetter(row, String(name), caseSensitive) as unknown,
    });
}

export function evalTableRowFilterExpr(
    expr: string,
    row: Record<string, unknown>,
    rowIndex: number,
    caseSensitive: boolean
): boolean {
    const t = expr.trim();
    if (!t) return true;
    const c = createRowProxy(row, caseSensitive);
    return Boolean(
        engine.evalSync(t, {
            row: c,
            c,
            rowIndex,
            i: rowIndex,
        })
    );
}

export function evalJsonTransformToValue(
    transform: string,
    value: unknown,
    root: unknown,
    path: string
): unknown {
    const t = transform.trim();
    if (!t) return value;
    return engine.evalSync(t, {
        value,
        v: value,
        root,
        data: root,
        path,
        p: path,
        at: (p?: unknown) => (root == null ? undefined : getByPath(root, String(p))),
    });
}

export { engine as jexlEngine };
