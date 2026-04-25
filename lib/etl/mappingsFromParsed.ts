import { uniquePaths, flattenJson } from "./flatten";
import type { MappingRule, ParsedData } from "./types";

export function buildInitialMappings(parsed: ParsedData): MappingRule[] {
    if (parsed.kind === "tabular") {
        return parsed.headers.map((h) => ({ original: h, remapped: "", transform: "" }));
    }
    if (parsed.kind === "json" || parsed.kind === "xml") {
        const list = uniquePaths(flattenJson(parsed.data));
        return list.map((f) => ({ original: f.path, remapped: "", transform: "" }));
    }
    return [];
}

export function countHierarchicalPaths(parsed: ParsedData): number {
    if (parsed.kind === "json" || parsed.kind === "xml") {
        return uniquePaths(flattenJson(parsed.data)).length;
    }
    if (parsed.kind === "tabular") {
        return parsed.headers.length;
    }
    return 0;
}

export function hasMorePathsThan(parsed: ParsedData, limit: number): boolean {
    if (limit <= 0) return false;
    if (parsed.kind === "json" || parsed.kind === "xml") {
        return countHierarchicalPaths(parsed) > limit;
    }
    if (parsed.kind === "tabular") {
        return parsed.headers.length > limit;
    }
    return false;
}
