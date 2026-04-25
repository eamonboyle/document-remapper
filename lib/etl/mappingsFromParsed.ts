import { uniquePaths, flattenJson } from "./flatten";
import type { MappingRule, ParsedData } from "./types";

const MAX_PATHS = 2000;

export function buildInitialMappings(parsed: ParsedData): MappingRule[] {
    if (parsed.kind === "tabular") {
        return parsed.headers.map((h) => ({ original: h, remapped: "" }));
    }
    if (parsed.kind === "json" || parsed.kind === "xml") {
        const flat = uniquePaths(flattenJson(parsed.data));
        const list = flat.slice(0, MAX_PATHS);
        return list.map((f) => ({ original: f.path, remapped: "" }));
    }
    return [];
}

export function hasMorePathsThan(parsed: ParsedData, limit: number): boolean {
    if (parsed.kind === "json" || parsed.kind === "xml") {
        const n = uniquePaths(flattenJson(parsed.data)).length;
        return n > limit;
    }
    if (parsed.kind === "tabular") {
        return parsed.headers.length > limit;
    }
    return false;
}
