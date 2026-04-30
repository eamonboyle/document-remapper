"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Download,
    Redo,
    Save,
    Undo,
    Upload,
    FileJson,
    Table2,
    ArrowLeft,
    Plus,
    Search,
    ChevronDown,
    RefreshCw,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
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

function describeParsed(parsed: ParsedData): { title: string; rows: number | null; fields: number | null; icon: "tabular" | "json" } {
    if (parsed.kind === "tabular") {
        return { title: parsed.source.toUpperCase(), rows: parsed.rows.length, fields: parsed.headers.length, icon: "tabular" };
    }
    if (parsed.kind === "json" || parsed.kind === "xml") {
        return { title: parsed.kind === "json" ? "JSON" : "XML", rows: null, fields: null, icon: "json" };
    }
    return { title: "Unknown", rows: null, fields: null, icon: "json" };
}

function guessType(value: unknown): string {
    if (typeof value === "boolean") return "bool";
    if (typeof value === "number") return "num";
    if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
        return "str";
    }
    if (Array.isArray(value)) return "arr";
    if (value && typeof value === "object") return "obj";
    return "str";
}

function TypeBadge({ type }: { type: string }) {
    const cls: Record<string, string> = {
        str: "type-str", num: "type-num", bool: "type-bool", date: "type-date", obj: "type-obj", arr: "type-obj",
    };
    return <span className={cn("type-badge", cls[type] ?? "type-str")}>{type}</span>;
}

export function DataMapper({ initialText, fileLabel, fileUrl, initialParsed }: DataMapperProps) {
    const [fileText, setFileText] = useState(initialText);
    const [activeFileName, setActiveFileName] = useState(fileLabel);
    const [sourceNote, setSourceNote] = useState<string | null>(null);
    const [isBinarySource, setIsBinarySource] = useState(false);
    const sessionRef = useRef<ParsedData | null | undefined>(initialParsed);

    const [parsed, setParsed] = useState<ParsedData | null>(null);
    const [mappings, setMappings] = useState<MappingRule[]>([]);
    const mappingsRef = useRef<MappingRule[]>([]);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
    const [preview, setPreview] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [etlOptions, setEtlOptions] = useState<EtlOptions>(defaultEtlOptions);
    const [searchTerm, setSearchTerm] = useState("");
    const [savedPulse, setSavedPulse] = useState(false);

    const [mappingHistory, setMappingHistory] = useState<MappingRule[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const historyIndexRef = useRef(0);

    useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
    useEffect(() => { mappingsRef.current = mappings; }, [mappings]);
    useEffect(() => {
        setFileText(initialText);
        setActiveFileName(fileLabel);
    }, [initialText, fileLabel]);

    const applyParsed = useCallback((p: ParsedData) => {
        setParsed(p);
        if (p.kind === "unknown") {
            setError(p.hint ? `Could not read structured data: ${p.hint}` : "Unrecognized file format. Try CSV, TSV, JSON, XML, XLSX, or JSON Lines.");
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
        if (isBinarySource) return;
        const s = sessionRef.current;
        if (s) {
            sessionRef.current = undefined;
            if (s.kind === "tabular" && s.source === "xlsx") {
                setSourceNote(`Excel: ${s.rows.length} data row(s), ${s.headers.length} column(s).`);
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
            setError(e instanceof Error ? e.message : "Failed to parse file");
            setParsed(null);
            setMappings([]);
        }
    }, [fileText, activeFileName, isBinarySource, applyParsed]);

    useEffect(() => {
        if (!parsed || parsed.kind === "unknown") { setPreview(""); return; }
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
        return mappings.filter((m) => m.original.toLowerCase().includes(s) || m.remapped.toLowerCase().includes(s));
    }, [mappings, searchTerm]);

    const summary = useMemo(() => (parsed && parsed.kind !== "unknown" ? describeParsed(parsed) : null), [parsed]);
    const pathsTruncated = useMemo(
        () => (parsed && parsed.kind !== "unknown" ? hasMorePathsThan(parsed, 2000) : false),
        [parsed]
    );

    const mappedCount = useMemo(() => mappings.filter((m) => m.remapped && m.remapped !== m.original).length, [mappings]);
    const unmappedCount = mappings.length - mappedCount;

    const sourceDisplay = useMemo(() => {
        if (sourceNote) return sourceNote;
        if (fileText.length > 120_000) return `${fileText.slice(0, 120_000)}\n\n… [truncated]`;
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
            setError(e instanceof Error ? e.message : "Download failed");
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
        setSavedPulse(true);
        setTimeout(() => setSavedPulse(false), 2000);
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
                if (!Array.isArray(arr) || !arr.every((m) => m && typeof m.original === "string" && typeof m.remapped === "string")) {
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
        if (file.size > 16 * 1024 * 1024) { setError("File is too large (max 16MB in browser)."); return; }
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
                    setFileText(""); setSourceNote(p.hint || "Could not read spreadsheet."); setError(p.hint || "Could not read spreadsheet."); setIsBinarySource(false); return;
                }
                setFileText("");
                if (p.kind === "tabular" && p.source === "xlsx") {
                    setSourceNote(`Excel: ${p.rows.length} data row(s), ${p.headers.length} column(s).`);
                } else {
                    setSourceNote("File loaded. Raw preview not shown for this format.");
                }
                applyParsed(p);
            };
            reader.readAsArrayBuffer(file);
        } else {
            setIsBinarySource(false);
            const reader = new FileReader();
            reader.onload = () => { const t = reader.result; if (typeof t === "string") setFileText(t); };
            reader.readAsText(file, "UTF-8");
        }
        event.target.value = "";
    }, [applyParsed]);

    if (error && !parsed) {
        return (
            <div className="container max-w-7xl px-4 py-8">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/8 px-5 py-5">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <Button size="sm" className="rounded-lg" asChild><Link href="/">Home</Link></Button>
                        <Button size="sm" variant="outline" className="rounded-lg" asChild><Link href="/upload">Cloud upload</Link></Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-3.375rem)] flex-col">
            {/* ── Top toolbar ────────────────────────────────────────────────── */}
            <div className="border-b border-white/[0.05] bg-card/50 backdrop-blur-md">
                <div className="container max-w-full px-4">
                    {/* Breadcrumb row */}
                    <div className="flex h-10 items-center gap-2 border-b border-white/[0.04]">
                        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-3 w-3" />
                            Dashboard
                        </Link>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-xs font-medium text-foreground">{activeFileName}</span>
                        {savedPulse && (
                            <span className="ml-1 flex items-center gap-1 text-xs text-brand">
                                <CheckCircle2 className="h-3 w-3" /> Saved
                            </span>
                        )}
                    </div>
                    {/* Action row */}
                    <div className="flex h-12 items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="h-8 w-8 rounded-lg p-0 text-muted-foreground"
                                title="Undo"
                            >
                                <Undo className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={redo}
                                disabled={historyIndex >= mappingHistory.length - 1}
                                className="h-8 w-8 rounded-lg p-0 text-muted-foreground"
                                title="Redo"
                            >
                                <Redo className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer">
                                <span className="sr-only">Load preset</span>
                                <input type="file" accept="application/json,.json" className="hidden" onChange={loadMappingPreset} />
                                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground">
                                    Load preset
                                </span>
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={saveMappingPreset}
                                className="h-8 gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                <Save className="h-3.5 w-3.5" />
                                Save mapping
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={downloadExport}
                                disabled={!parsed || parsed.kind === "unknown"}
                                className="h-8 gap-1.5 rounded-lg bg-brand px-4 text-xs font-semibold text-brand-foreground shadow-[0_0_16px_hsl(var(--brand)/0.3)] hover:bg-brand/90"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Error banner ─────────────────────────────────────────────── */}
            {error && (
                <div className="border-b border-amber-500/20 bg-amber-500/8 px-4 py-2.5">
                    <div className="container max-w-full flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <p className="text-xs text-amber-200">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Three-panel layout ───────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Panel 1: Source */}
                <div className="flex w-64 shrink-0 flex-col border-r border-white/[0.05] bg-card/30">
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</h2>
                        <label className="cursor-pointer">
                            <input type="file" accept={ACCEPT} className="hidden" onChange={onReplaceLocalFile} />
                            <span className="inline-flex items-center gap-1 text-[0.7rem] text-brand hover:underline">
                                <RefreshCw className="h-3 w-3" /> Replace
                            </span>
                        </label>
                    </div>

                    {/* File info */}
                    <div className="border-b border-white/[0.04] px-4 py-3">
                        <div className="flex items-center gap-2">
                            {summary?.icon === "tabular" ? (
                                <Table2 className="h-4 w-4 shrink-0 text-brand/70" aria-hidden />
                            ) : (
                                <FileJson className="h-4 w-4 shrink-0 text-brand/70" aria-hidden />
                            )}
                            <span className="min-w-0 truncate text-[0.8125rem] font-medium text-foreground">{activeFileName}</span>
                        </div>
                        {summary && (
                            <p className="mt-1 text-[0.7rem] text-muted-foreground">
                                {summary.title}
                                {summary.rows !== null && ` · ${summary.rows} rows`}
                                {summary.fields !== null && ` · ${summary.fields} fields`}
                            </p>
                        )}
                        {fileUrl && (
                            <p className="mt-0.5 text-[0.65rem] text-muted-foreground/60">Cloud upload</p>
                        )}
                    </div>

                    {/* Field list / source preview */}
                    <div className="min-h-0 flex-1 overflow-auto p-4">
                        {parsed && parsed.kind === "tabular" ? (
                            <div>
                                <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                    Fields ({parsed.headers.length})
                                </p>
                                <div className="space-y-0.5">
                                    {parsed.headers.map((h, i) => {
                                        const sampleVal = parsed.rows[0]?.[h];
                                        const type = guessType(sampleVal);
                                        return (
                                            <div key={h} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.03]">
                                                <span className="min-w-0 truncate font-mono text-[0.7rem] text-muted-foreground">{h}</span>
                                                <TypeBadge type={type} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <pre className="overflow-auto rounded-lg border border-white/[0.05] bg-background/40 p-3 font-mono text-[0.62rem] leading-relaxed text-muted-foreground">
                                {sourceDisplay || "—"}
                            </pre>
                        )}
                    </div>

                    {/* Add virtual field */}
                    <div className="border-t border-white/[0.04] p-3">
                        <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] py-2 text-xs text-muted-foreground/60 transition-colors hover:border-brand/30 hover:text-brand">
                            <Plus className="h-3.5 w-3.5" />
                            Add virtual field
                        </button>
                    </div>
                </div>

                {/* Panel 2: Field Mapping */}
                <div className="flex min-w-0 flex-1 flex-col border-r border-white/[0.05]">
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field mapping</h2>
                            <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand">
                                <CheckCircle2 className="h-3 w-3" />
                                {mappedCount} Mapped
                            </span>
                            {unmappedCount > 0 && (
                                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                                    {unmappedCount} Unmapped
                                </span>
                            )}
                        </div>
                        <button className="text-[0.7rem] text-brand hover:underline">Auto-map</button>
                    </div>

                    {/* Search */}
                    <div className="border-b border-white/[0.04] px-4 py-2.5">
                        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-background/40 px-3 py-1.5">
                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            <input
                                type="search"
                                placeholder="Search fields…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="text-muted-foreground/40 hover:text-muted-foreground">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-2 border-b border-white/[0.04] bg-white/[0.02] px-4 py-2">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">Source field</span>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">Target (export name / path)</span>
                    </div>

                    {/* Mapping rows */}
                    <div className="min-h-0 flex-1 overflow-auto">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                <Search className="h-6 w-6 text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No fields match &quot;{searchTerm}&quot;</p>
                            </div>
                        ) : (
                            filtered.map((mapping) => {
                                const isMapped = mapping.remapped && mapping.remapped !== mapping.original;
                                return (
                                    <div
                                        key={mapping.original}
                                        className="grid grid-cols-2 items-center gap-2 border-b border-white/[0.03] px-4 py-2 transition-colors hover:bg-white/[0.02] last:border-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "h-1.5 w-1.5 shrink-0 rounded-full",
                                                    isMapped ? "bg-brand" : "bg-muted-foreground/30"
                                                )}
                                            />
                                            <span className="min-w-0 truncate font-mono text-[0.7rem] text-muted-foreground">
                                                {mapping.original}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            title={`Map ${mapping.original}`}
                                            value={getMappingByOriginal(mapping.original)?.remapped ?? ""}
                                            placeholder={mapping.original}
                                            onChange={(e) => setRemapForOriginal(mapping.original, e.target.value)}
                                            className="w-full min-w-0 rounded-lg border border-transparent bg-white/[0.03] px-2.5 py-1.5 font-mono text-[0.7rem] text-foreground placeholder:text-muted-foreground/30 transition-colors focus:border-brand/40 focus:bg-background/60 focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Row options */}
                    <div className="border-t border-white/[0.04] bg-white/[0.01] px-4 py-3">
                        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            Row options (tabular)
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={!etlOptions.caseSensitive}
                                    onChange={(e) => setEtlOptions((o) => ({ ...o, caseSensitive: !e.target.checked }))}
                                    className="accent-brand"
                                />
                                Case-insensitive match
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={etlOptions.trimWhitespace}
                                    onChange={(e) => setEtlOptions((o) => ({ ...o, trimWhitespace: e.target.checked }))}
                                    className="accent-brand"
                                />
                                Trim whitespace
                            </label>
                        </div>
                        {pathsTruncated && (
                            <p className="mt-2 text-[0.65rem] text-muted-foreground/60">
                                More than 2000 paths detected — only first 2000 shown.
                            </p>
                        )}
                    </div>
                </div>

                {/* Panel 3: Preview */}
                <div className="flex w-80 shrink-0 flex-col">
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview output</h2>
                        <div className="flex items-center gap-1">
                            {EXPORT_FORMATS.slice(0, 3).map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setExportFormat(f.value)}
                                    className={cn(
                                        "rounded px-2 py-0.5 text-[0.65rem] font-semibold transition-colors",
                                        exportFormat === f.value
                                            ? "bg-brand/15 text-brand"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export format select */}
                    <div className="border-b border-white/[0.04] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                Export as
                            </label>
                            <div className="relative flex-1">
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                    className="w-full appearance-none rounded-lg border border-white/[0.06] bg-background/40 py-1.5 pl-2.5 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                                >
                                    {EXPORT_FORMATS.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
                            </div>
                        </div>
                    </div>

                    {/* Preview content */}
                    <div className="min-h-0 flex-1 overflow-auto p-4">
                        <pre className="min-h-[200px] rounded-lg border border-white/[0.05] bg-background/50 p-3 font-mono text-[0.62rem] leading-relaxed text-muted-foreground">
                            {preview || "—"}
                        </pre>
                    </div>

                    {/* Export options */}
                    <div className="border-t border-white/[0.04] bg-white/[0.01] p-4 space-y-3">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/60">Export options</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">File format</span>
                                <span className="text-xs font-medium text-foreground">{exportFormat.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">File name</span>
                                <span className="max-w-[120px] truncate text-right text-xs font-medium text-foreground">
                                    {activeFileName.replace(/\.[^.]+$/, "")}_export.{exportFormat}
                                </span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={downloadExport}
                            disabled={!parsed || parsed.kind === "unknown"}
                            className="w-full gap-1.5 rounded-lg bg-brand text-xs font-semibold text-brand-foreground hover:bg-brand/90"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Download {exportFormat.toUpperCase()}
                        </Button>
                        <label className="block cursor-pointer">
                            <input type="file" accept={ACCEPT} className="hidden" onChange={onReplaceLocalFile} />
                            <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] py-2 text-xs text-muted-foreground transition-colors hover:border-white/[0.15] hover:text-foreground">
                                <Upload className="h-3.5 w-3.5" />
                                Replace file
                            </span>
                        </label>
                        {fileUrl && (
                            <Button variant="ghost" size="sm" className="w-full gap-1.5 rounded-lg text-xs text-muted-foreground" asChild>
                                <Link href="/upload">
                                    <Upload className="h-3.5 w-3.5" />
                                    Cloud upload
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
