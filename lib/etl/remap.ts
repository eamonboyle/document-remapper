import { XMLBuilder } from "fast-xml-parser";
import Papa from "papaparse";
import * as YAML from "yaml";
import * as XLSX from "xlsx";
import type { EtlOptions, ExportFormat, MappingRule, ParsedData, TabularRow, TabularValue } from "./types";
import { defaultEtlOptions } from "./types";
import { getByPath, buildObjectFromPaths } from "./nested";
import { isPlainObject } from "./flatten";
import { evalTableTransformToValue, evalTableRowFilterExpr, evalJsonTransformToValue } from "./expr";

function normalizeKey(key: string, options: EtlOptions): string {
    let k = key;
    if (options.trimWhitespace) k = k.trim();
    return k;
}

function toTabularCell(v: unknown): TabularValue {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

function getTabularValue(row: TabularRow, key: string, options: EtlOptions): TabularValue {
    if (key in row) {
        const v = row[key];
        if (typeof v === "string" && options.trimWhitespace) {
            return v.trim();
        }
        return v ?? null;
    }
    if (options.caseSensitive) return null;
    const lower = key.toLowerCase();
    for (const k of Object.keys(row)) {
        if (k.toLowerCase() === lower) {
            const v = row[k];
            if (typeof v === "string" && options.trimWhitespace) {
                return v.trim();
            }
            return (v as TabularValue) ?? null;
        }
    }
    return null;
}

function rowFilterExpr(o: EtlOptions): string {
    return (o.tableRowFilter ?? o.rowFilter ?? "").trim();
}

export function applyMappingsTabular(
    rows: TabularRow[],
    mappings: MappingRule[],
    options: EtlOptions
): TabularRow[] {
    const filterStr = rowFilterExpr(options);
    const rowObjs = rows as unknown as Record<string, unknown>[];
    const afterFilter = filterStr
        ? rowObjs.filter((row, i) => {
              try {
                  return evalTableRowFilterExpr(filterStr, row, i, !options.caseSensitive);
              } catch {
                  return true;
              }
          })
        : rowObjs;

    return afterFilter.map((row, rowIndex) => {
        const newRow: TabularRow = {};
        for (const m of mappings) {
            const orig = normalizeKey(m.original, options);
            const raw = getTabularValue(row as TabularRow, m.original, options);
            let v: unknown = raw;
            const t = (m.transform ?? "").trim();
            if (t) {
                try {
                    v = evalTableTransformToValue(t, raw, m.original, row, rowIndex, !options.caseSensitive);
                } catch {
                    v = raw;
                }
            }
            const cell = toTabularCell(v);
            if (m.remapped.trim() === "") {
                newRow[orig] = cell;
            } else {
                newRow[normalizeKey(m.remapped, { ...options, caseSensitive: true })] = cell;
            }
        }
        return newRow;
    });
}

export function applyMappingsJson(data: unknown, mappings: MappingRule[]): unknown {
    const pairs: { path: string; value: unknown }[] = [];
    for (const m of mappings) {
        if (!m.original) continue;
        const value0 = getByPath(data, m.original);
        if (value0 === undefined) continue;
        let value: unknown = value0;
        const t = (m.transform ?? "").trim();
        if (t) {
            try {
                value = evalJsonTransformToValue(t, value0, data, m.original);
            } catch {
                value = value0;
            }
        }
        const path = m.remapped.trim() || m.original;
        pairs.push({ path, value });
    }
    return buildObjectFromPaths(pairs);
}

function xmlRootKey(data: unknown): string {
    if (isPlainObject(data) && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 1) return keys[0];
    }
    return "root";
}

export function applyMappingsXml(data: unknown, mappings: MappingRule[]): string {
    const remapped = applyMappingsJson(data, mappings);
    const originalRoot = xmlRootKey(data);
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: "  ",
        attributeNamePrefix: "@_",
        textNodeName: "#text",
    });
    if (isPlainObject(remapped) && Object.keys(remapped).length === 1) {
        return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(remapped)}`;
    }
    const wrapped = { [originalRoot]: remapped };
    return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(wrapped)}`;
}

export function exportData(
    parsed: ParsedData,
    mappings: MappingRule[],
    format: ExportFormat,
    options: EtlOptions = defaultEtlOptions
): { content: string; mime: string; extension: string; binary?: Uint8Array } {
    if (parsed.kind === "tabular") {
        const outRows = applyMappingsTabular(parsed.rows, mappings, options);
        if (format === "xlsx") {
            const ws = XLSX.utils.json_to_sheet(outRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "export");
            const u8 = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
            return {
                content: "",
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                extension: "xlsx",
                binary: u8,
            };
        }
        if (format === "jsonl") {
            const lines = outRows.map((r) => JSON.stringify(r)).join("\n");
            return { content: lines + "\n", mime: "application/x-ndjson", extension: "jsonl" };
        }
        if (format === "json") {
            return { content: JSON.stringify(outRows, null, 2) + "\n", mime: "application/json", extension: "json" };
        }
        if (format === "yaml") {
            return { content: YAML.stringify(outRows), mime: "text/yaml", extension: "yaml" };
        }
        if (format === "xml") {
            const b = new XMLBuilder({ format: true, ignoreAttributes: false, attributeNamePrefix: "@_" });
            const wrapped = { records: { row: outRows } };
            return {
                content: `<?xml version="1.0" encoding="UTF-8"?>\n${b.build(wrapped)}`,
                mime: "application/xml",
                extension: "xml",
            };
        }
        const sep = format === "tsv" ? "\t" : ",";
        const csv = Papa.unparse(outRows, { quotes: true, delimiter: sep });
        return {
            content: csv,
            mime: format === "tsv" ? "text/tab-separated-values" : "text/csv",
            extension: format === "tsv" ? "tsv" : "csv",
        };
    }

    if (parsed.kind === "json") {
        const remapped = applyMappingsJson(parsed.data, mappings) as unknown;
        if (format === "xlsx" && Array.isArray(remapped) && (remapped.length === 0 || isPlainObject(remapped[0]))) {
            const rows = remapped as TabularRow[];
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "export");
            const u8 = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
            return { content: "", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", binary: u8 };
        }
        if (format === "json") {
            return { content: JSON.stringify(remapped, null, 2) + "\n", mime: "application/json", extension: "json" };
        }
        if (format === "jsonl" && Array.isArray(remapped)) {
            const lines = (remapped as unknown[]).map((r) => JSON.stringify(r)).join("\n");
            return { content: lines + "\n", mime: "application/x-ndjson", extension: "jsonl" };
        }
        if (format === "yaml") {
            return { content: YAML.stringify(remapped), mime: "text/yaml", extension: "yaml" };
        }
        if (format === "csv" || format === "tsv") {
            if (Array.isArray(remapped) && (remapped.length === 0 || isPlainObject(remapped[0]))) {
                const rows = remapped as TabularRow[];
                const sep = format === "tsv" ? "\t" : ",";
                return {
                    content: Papa.unparse(rows, { quotes: true, delimiter: sep }),
                    mime: format === "tsv" ? "text/tab-separated-values" : "text/csv",
                    extension: format === "tsv" ? "tsv" : "csv",
                };
            }
            if (isPlainObject(remapped)) {
                const row: TabularRow = {};
                for (const [k, v] of Object.entries(remapped as Record<string, unknown>)) {
                    row[k] = v as TabularValue;
                }
                const sep = format === "tsv" ? "\t" : ",";
                return {
                    content: Papa.unparse([row], { quotes: true, delimiter: sep }),
                    mime: format === "tsv" ? "text/tab-separated-values" : "text/csv",
                    extension: format === "tsv" ? "tsv" : "csv",
                };
            }
        }
        if (format === "xlsx" && isPlainObject(remapped)) {
            const row: TabularRow = {};
            for (const [k, v] of Object.entries(remapped as Record<string, unknown>)) {
                row[k] = v as TabularValue;
            }
            const ws = XLSX.utils.json_to_sheet([row]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "export");
            const u8 = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
            return { content: "", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", binary: u8 };
        }
        if (format === "xml") {
            return {
                content: isPlainObject(remapped) ? `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLBuilder({ format: true, ignoreAttributes: false, attributeNamePrefix: "@_" }).build(remapped)}` : `<?xml version="1.0" encoding="UTF-8"?>\n<root>${String(remapped)}</root>`,
                mime: "application/xml",
                extension: "xml",
            };
        }
    }

    if (parsed.kind === "xml") {
        if (format === "xml") {
            return { content: applyMappingsXml(parsed.data, mappings), mime: "application/xml", extension: "xml" };
        }
        const remapped = applyMappingsJson(parsed.data, mappings);
        if (format === "json") {
            return { content: JSON.stringify(remapped, null, 2) + "\n", mime: "application/json", extension: "json" };
        }
        if (format === "yaml") {
            return { content: YAML.stringify(remapped), mime: "text/yaml", extension: "yaml" };
        }
        if (format === "jsonl" && Array.isArray(remapped)) {
            const lines = (remapped as unknown[]).map((r) => JSON.stringify(r)).join("\n");
            return { content: lines + "\n", mime: "application/x-ndjson", extension: "jsonl" };
        }
        if (format === "xlsx" && Array.isArray(remapped) && (remapped.length === 0 || isPlainObject(remapped[0]))) {
            const rows = remapped as TabularRow[];
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "export");
            const u8 = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
            return { content: "", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", binary: u8 };
        }
        if ((format === "csv" || format === "tsv") && isPlainObject(remapped)) {
            const row: TabularRow = {};
            for (const [k, v] of Object.entries(remapped as Record<string, unknown>)) {
                row[k] = v as TabularValue;
            }
            const sep = format === "tsv" ? "\t" : ",";
            return {
                content: Papa.unparse([row], { quotes: true, delimiter: sep }),
                mime: format === "tsv" ? "text/tab-separated-values" : "text/csv",
                extension: format === "tsv" ? "tsv" : "csv",
            };
        }
    }

    if (parsed.kind === "unknown") {
        return {
            content: parsed.raw,
            mime: "text/plain",
            extension: "txt",
        };
    }

    throw new Error("Export not supported for this data / format combination. Try a different target format or adjust mappings.");
}
