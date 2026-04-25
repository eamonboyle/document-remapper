"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Redo, Save, Sun, Undo, Upload, Moon, FileJson, Table2 } from "lucide-react";
import {
    type ExportFormat,
    type MappingRule,
    type ParsedData,
    type EtlOptions,
    defaultEtlOptions,
    parseTextContent,
    parseArrayBuffer,
    buildInitialMappings,
    hasMorePathsThan,
    buildPreview,
    exportData,
} from "@/lib/etl";
import { cn } from "@/lib/utils";

interface DataMapperProps {
    initialText: string;
    fileLabel: string;
    fileUrl?: string;
    /** When set (e.g. local session with Excel), skip text parsing */
    initialParsed?: ParsedData | null;
}

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
    { value: "json", label: "JSON" },
    { value: "csv", label: "CSV" },
    { value: "tsv", label: "TSV" },
    { value: "yaml", label: "YAML" },
    { value: "jsonl", label: "JSON Lines" },
    { value: "xml", label: "XML" },
    { value: "xlsx", label: "Excel (.xlsx)" },
];

const ACCEPT =
    ".csv,.tsv,.tab,.json,.jsonl,.ndjson,.xml,.xlsx,.xls,.txt,application/json,text/csv,text/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function describeParsed(parsed: ParsedData): { title: string; icon: "tabular" | "json" } {
    if (parsed.kind === "tabular") {
        return {
            title: `${parsed.source.toUpperCase()} — ${parsed.rows.length} row(s), ${parsed.headers.length} field(s)`,
            icon: "tabular",
        };
    }
    if (parsed.kind === "json" || parsed.kind === "xml") {
        return { title: parsed.kind === "json" ? "JSON" : "XML", icon: "json" };
    }
    return { title: "Text / unknown", icon: "json" };
}

export function DataMapper({ initialText, fileLabel, fileUrl, initialParsed }: DataMapperProps) {
    const [fileText, setFileText] = useState(initialText);
    const [activeFileName, setActiveFileName] = useState(fileLabel);
    const [sourceNote, setSourceNote] = useState<string | null>(null);
    /** xlsx is parsed from ArrayBuffer; do not re-parse from empty fileText */
    const [isBinarySource, setIsBinarySource] = useState(false);
    /** One-shot parsed from parent session (e.g. Excel from home); consumed on first run */
    const sessionRef = useRef<ParsedData | null | undefined>(initialParsed);

    const [parsed, setParsed] = useState<ParsedData | null>(null);
    const [mappings, setMappings] = useState<MappingRule[]>([]);
    const mappingsRef = useRef<MappingRule[]>([]);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
    const [preview, setPreview] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [etlOptions, setEtlOptions] = useState<EtlOptions>(defaultEtlOptions);
    const [darkMode, setDarkMode] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [mappingHistory, setMappingHistory] = useState<MappingRule[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const historyIndexRef = useRef(0);

    useEffect(() => {
        historyIndexRef.current = historyIndex;
    }, [historyIndex]);
    useEffect(() => {
        mappingsRef.current = mappings;
    }, [mappings]);

    useEffect(() => {
        setFileText(initialText);
        setActiveFileName(fileLabel);
    }, [initialText, fileLabel]);

    const applyParsed = useCallback((p: ParsedData) => {
        setParsed(p);
        if (p.kind === "unknown") {
            setError(
                p.hint
                    ? `Could not read structured data: ${p.hint}`
                    : "Unrecognized file format. Try CSV, TSV, JSON, XML, XLSX, or JSON Lines."
            );
        } else {
            setError(null);
        }
        const initial = buildInitialMappings(p);
        setMappings(initial);
        mappingsRef.current = initial;
        setMappingHistory([initial.map((m) => ({ ...m }))]);
        setHistoryIndex(0);
        historyIndexRef.current = 0;
    }, []);

    useEffect(() => {
        if (isBinarySource) {
            return;
        }
        const s = sessionRef.current;
        if (s) {
            sessionRef.current = undefined;
            if (s.kind === "tabular" && s.source === "xlsx") {
                setSourceNote(
                    `Excel: ${s.rows.length} data row(s), ${s.headers.length} column(s). Raw cell grid is not shown.`
                );
                setIsBinarySource(true);
            } else {
                setSourceNote(null);
            }
            applyParsed(s);
            return;
        }
        setSourceNote(null);
        try {
            const p = parseTextContent(fileText, activeFileName);
            applyParsed(p);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to parse file";
            setError(message);
            setParsed(null);
            setMappings([]);
        }
    }, [fileText, activeFileName, isBinarySource, applyParsed]);

    useEffect(() => {
        if (!parsed || parsed.kind === "unknown") {
            setPreview("");
            return;
        }
        setPreview(buildPreview(parsed, mappings, exportFormat, etlOptions));
    }, [parsed, mappings, exportFormat, etlOptions]);

    const getMappingByOriginal = useCallback(
        (original: string) => mappings.find((m) => m.original === original),
        [mappings]
    );

    const setRemapForOriginal = useCallback((original: string, remapped: string) => {
        const next = mappingsRef.current.map((m) => (m.original === original ? { ...m, remapped } : m));
        mappingsRef.current = next;
        setMappings(next);
        const headIdx = historyIndexRef.current;
        setMappingHistory((h) => [...h.slice(0, headIdx + 1), next.map((m) => ({ ...m }))]);
        setHistoryIndex((c) => {
            const n = c + 1;
            historyIndexRef.current = n;
            return n;
        });
    }, []);

    const filtered = useMemo(() => {
        const s = searchTerm.toLowerCase();
        if (!s) return mappings;
        return mappings.filter(
            (m) => m.original.toLowerCase().includes(s) || m.remapped.toLowerCase().includes(s)
        );
    }, [mappings, searchTerm]);

    const summary = useMemo(() => (parsed && parsed.kind !== "unknown" ? describeParsed(parsed) : null), [parsed]);
    const pathsTruncated = useMemo(
        () => (parsed && parsed.kind !== "unknown" ? hasMorePathsThan(parsed, 2000) : false),
        [parsed]
    );

    const sourceDisplay = useMemo(() => {
        if (sourceNote) {
            return sourceNote;
        }
        if (fileText.length > 120_000) {
            return `${fileText.slice(0, 120_000)}\n\n… [truncated for display]`;
        }
        return fileText;
    }, [fileText, sourceNote]);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;
        const newIndex = historyIndexRef.current - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        const m = mappingHistory[newIndex].map((x) => ({ ...x }));
        mappingsRef.current = m;
        setMappings(m);
    }, [mappingHistory]);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= mappingHistory.length - 1) return;
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        const m = mappingHistory[newIndex].map((x) => ({ ...x }));
        mappingsRef.current = m;
        setMappings(m);
    }, [mappingHistory]);

    const downloadExport = useCallback(() => {
        if (!parsed || parsed.kind === "unknown") return;
        try {
            setError(null);
            const out = exportData(parsed, mappings, exportFormat, etlOptions);
            const nameBase = activeFileName.replace(/\.[^.]+$/, "") || "export";
            if (out.binary) {
                const blob = new Blob([out.binary], { type: out.mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${nameBase}.${out.extension}`;
                a.click();
                URL.revokeObjectURL(url);
                return;
            }
            const blob = new Blob([out.content], { type: out.mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${nameBase}.${out.extension}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Download failed";
            setError(message);
        }
    }, [parsed, mappings, exportFormat, etlOptions, activeFileName]);

    const saveMappingPreset = useCallback(() => {
        const blob = new Blob([JSON.stringify(mappings, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "field-mapping.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [mappings]);

    const loadMappingPreset = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (typeof data !== "string") return;
                const arr = JSON.parse(data) as MappingRule[];
                if (
                    !Array.isArray(arr) ||
                    !arr.every((m) => m && typeof m.original === "string" && typeof m.remapped === "string")
                ) {
                    setError("Invalid mapping file.");
                    return;
                }
                setError(null);
                mappingsRef.current = arr;
                setMappings(arr);
                setMappingHistory([arr.map((m) => ({ ...m }))]);
                setHistoryIndex(0);
                historyIndexRef.current = 0;
            } catch {
                setError("Could not read mapping file.");
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    }, []);

    const onReplaceLocalFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 16 * 1024 * 1024) {
            setError("File is too large (max 16MB in browser).");
            return;
        }
        setError(null);
        setSourceNote(null);
        const name = file.name;
        setActiveFileName(name);

        const isSpreadsheet = /\.(xlsx|xls)$/i.test(name);
        if (isSpreadsheet) {
            setIsBinarySource(true);
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (!(result instanceof ArrayBuffer)) return;
                const p = parseArrayBuffer(result, name);
                if (p.kind === "unknown") {
                    setFileText("");
                    setSourceNote(p.hint || "Could not read spreadsheet.");
                    setError(p.hint || "Could not read spreadsheet.");
                    setIsBinarySource(false);
                    return;
                }
                setFileText("");
                if (p.kind === "tabular" && p.source === "xlsx") {
                    setSourceNote(
                        `Excel: ${p.rows.length} data row(s), ${p.headers.length} column(s). Raw cell grid is not shown.`
                    );
                } else {
                    setSourceNote("File loaded. Raw preview is not shown for this format.");
                }
                applyParsed(p);
            };
            reader.readAsArrayBuffer(file);
        } else {
            setIsBinarySource(false);
            const reader = new FileReader();
            reader.onload = () => {
                const t = reader.result;
                if (typeof t === "string") {
                    setFileText(t);
                }
            };
            reader.readAsText(file, "UTF-8");
        }
        event.target.value = "";
    }, [applyParsed]);

    if (error && !parsed) {
        return <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error}</div>;
    }

    return (
        <div
            className={cn(
                "flex min-h-0 flex-col gap-6 rounded-xl border p-4 sm:p-6",
                darkMode ? "border-border bg-zinc-950/40 text-zinc-100" : "border-zinc-200 bg-white text-zinc-900"
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Map & export</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {activeFileName}
                        {fileUrl ? " · from upload" : " · local"}
                    </p>
                    {summary && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            {summary.icon === "tabular" ? (
                                <Table2 className="h-4 w-4 shrink-0" aria-hidden />
                            ) : (
                                <FileJson className="h-4 w-4 shrink-0" aria-hidden />
                            )}
                            {summary.title}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setDarkMode((d) => !d)}
                        title="Toggle theme"
                    >
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                    <label>
                        <span className="sr-only">Load mapping preset</span>
                        <input type="file" accept="application/json,.json" className="hidden" onChange={loadMappingPreset} />
                        <Button type="button" variant="secondary" className="cursor-pointer" asChild>
                            <span>Load preset</span>
                        </Button>
                    </label>
                    <Button type="button" variant="secondary" onClick={saveMappingPreset} title="Save field mapping">
                        <Save className="mr-1.5 h-4 w-4" />
                        Save mapping
                    </Button>
                    <Button type="button" onClick={downloadExport} title="Download export" disabled={!parsed || parsed.kind === "unknown"}>
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                    </Button>
                    <Button type="button" variant="outline" onClick={undo} disabled={historyIndex <= 0} title="Undo">
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={redo}
                        disabled={historyIndex < 0 || historyIndex >= mappingHistory.length - 1}
                        title="Redo"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {error && <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</div>}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Source</h2>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">
                                <input type="file" accept={ACCEPT} className="hidden" onChange={onReplaceLocalFile} />
                                <Button type="button" variant="ghost" size="sm" className="h-8 cursor-pointer" asChild>
                                    <span>Replace file</span>
                                </Button>
                            </label>
                            <Button type="button" variant="ghost" size="sm" asChild>
                                <Link href="/upload" className="h-8">
                                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                                    Cloud upload
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <pre
                        className={cn(
                            "max-h-72 overflow-auto rounded-lg p-3 text-xs leading-relaxed",
                            darkMode ? "bg-zinc-900" : "bg-zinc-100"
                        )}
                    >
                        {sourceDisplay}
                    </pre>
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[160px] flex-1">
                            <label htmlFor="export-format" className="text-sm font-medium">
                                Export as
                            </label>
                            <select
                                id="export-format"
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                className={cn(
                                    "mt-1.5 w-full rounded-md border px-3 py-2 text-sm",
                                    darkMode ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-200 bg-white"
                                )}
                            >
                                {EXPORT_FORMATS.map((f) => (
                                    <option key={f.value} value={f.value}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <h2 className="text-sm font-medium">Preview (target format)</h2>
                    <pre
                        className={cn(
                            "max-h-72 overflow-auto rounded-lg p-3 text-xs leading-relaxed",
                            darkMode ? "bg-zinc-900" : "bg-zinc-100"
                        )}
                    >
                        {preview || "—"}
                    </pre>
                </div>
            </div>

            {pathsTruncated && (
                <p className="text-xs text-muted-foreground">
                    More than 2000 paths were detected; only the first 2000 are shown. For very wide feeds, prefer a tabular export
                    (CSV) or split the file.
                </p>
            )}

            <div>
                <h2 className="mb-3 text-sm font-medium">Field mapping</h2>
                <p className="mb-3 text-xs text-muted-foreground">
                    <strong>Tabular:</strong> target column name per source column. <strong>JSON / XML:</strong> set a dot path (e.g.{" "}
                    <code className="rounded bg-zinc-800 px-1">customer.id</code>); arrays use numeric segments (e.g.{" "}
                    <code className="rounded bg-zinc-800 px-1">items.0.sku</code>). Leave target empty to keep the same name.
                </p>
                <input
                    type="search"
                    placeholder="Filter fields…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                        "mb-3 w-full rounded-md border px-3 py-2 text-sm",
                        darkMode ? "border-zinc-700 bg-zinc-900" : "border-zinc-200"
                    )}
                />
                <div className="max-h-[min(50vh,28rem)] overflow-auto rounded-lg border border-border/50">
                    <table className="w-full min-w-[280px] text-left text-sm">
                        <thead className="sticky top-0 bg-inherit text-xs text-muted-foreground">
                            <tr>
                                <th className="border-b px-2 py-2">Source</th>
                                <th className="border-b px-2 py-2">Target (export name / path)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((mapping) => (
                                <tr key={mapping.original} className="border-b border-border/30 last:border-0">
                                    <td className="break-all px-2 py-1.5 font-mono text-xs">{mapping.original}</td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            title={`Map ${mapping.original}`}
                                            value={getMappingByOriginal(mapping.original)?.remapped ?? ""}
                                            placeholder={mapping.original}
                                            onChange={(e) => setRemapForOriginal(mapping.original, e.target.value)}
                                            className={cn(
                                                "w-full min-w-0 rounded border px-2 py-1.5 text-xs",
                                                darkMode ? "border-zinc-600 bg-zinc-900" : "border-zinc-300"
                                            )}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="mb-2 text-sm font-medium">Row options (tabular)</h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={!etlOptions.caseSensitive}
                            onChange={(e) => setEtlOptions((o) => ({ ...o, caseSensitive: !e.target.checked }))}
                        />
                        Case-insensitive column match
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={etlOptions.trimWhitespace}
                            onChange={(e) => setEtlOptions((o) => ({ ...o, trimWhitespace: e.target.checked }))}
                        />
                        Trim string values
                    </label>
                </div>
            </div>
        </div>
    );
}
