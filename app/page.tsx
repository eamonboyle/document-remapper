"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { setRemapSession } from "@/lib/remapSession";
import {
    ArrowRight,
    Cloud,
    Upload,
    FileJson,
    CheckCircle2,
    Zap,
    Lock,
    RefreshCw,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_ACCEPT = ".csv,.tsv,.tab,.json,.jsonl,.ndjson,.xml,.xlsx,.xls,.txt,application/json,text/csv";

const STEPS = [
    { n: "1", label: "Import", sub: "Bring in your data" },
    { n: "2", label: "Map", sub: "Map fields or paths" },
    { n: "3", label: "Export", sub: "Preview and export" },
];

const TRUST_ITEMS = [
    { icon: Upload, label: "Local & cloud files" },
    { icon: FileJson, label: "CSV, JSON, XML, Excel & more" },
    { icon: RefreshCw, label: "Presets & reusability" },
    { icon: Lock, label: "No credit card required" },
];

const LOGOS = ["acme", "Northbeam", "Sisyphus", "huddle", "Cirrus"];

const INPUT_FORMATS = ["CSV", "TSV", "JSON", "XML", "Excel", "More"];
const OUTPUT_FORMATS = ["JSON", "CSV", "TSV", "YAML"];

const PRESETS = [
    { name: "Salesforce Contacts", format: "JSON", updated: "Updated 2d ago" },
    { name: "NetSuite Items", format: "CSV", updated: "Updated 1h ago" },
    { name: "HubSpot Companies", format: "JSON", updated: "Updated 2w ago" },
];

export default function Home() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const onPickLocal = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const processFile = useCallback(
        (file: File) => {
            if (file.size > 4 * 1024 * 1024) {
                setMsg('File exceeds 4 MB. Open the mapper and use "Replace file", or try cloud upload.');
                return;
            }
            setMsg(null);
            const name = file.name;
            const isXlsx = /\.(xlsx|xls)$/i.test(name);
            if (isXlsx) {
                const reader = new FileReader();
                reader.onload = () => {
                    const d = reader.result;
                    if (typeof d !== "string") return;
                    const b64 = d.split(",")[1] ?? d;
                    try {
                        setRemapSession({ kind: "binary", fileName: name, base64: b64 });
                        router.push("/remap?source=local");
                    } catch (er) {
                        setMsg(er instanceof Error ? er.message : "Could not store the file.");
                    }
                };
                reader.readAsDataURL(file);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    const t = reader.result;
                    if (typeof t !== "string") return;
                    try {
                        setRemapSession({ kind: "text", fileName: name, text: t });
                        router.push("/remap?source=local");
                    } catch (er) {
                        setMsg(er instanceof Error ? er.message : "Storage failed. Try a smaller file.");
                    }
                };
                reader.readAsText(file, "UTF-8");
            }
        },
        [router]
    );

    const onFile = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) processFile(file);
        },
        [processFile]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    return (
        <div className="w-full">
            {/* ── Hero ──────────────────────────────────── */}
            <section className="container max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
                <div className="mx-auto max-w-3xl text-center">
                    {/* Pill */}
                    <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-3.5 py-1.5 text-xs font-semibold text-brand shadow-[0_0_24px_hsl(var(--brand)/0.12)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        NEW · JSON path mapping &amp; transforms
                    </div>

                    {/* Headline */}
                    <h1 className="animate-fade-up-delay-1 mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl sm:leading-[1.06]">
                        Remap any data to<br className="hidden sm:block" />
                        <span className="text-brand"> the shape you need</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
                        Import from anywhere. Map fields or paths. Preview exactly what you&apos;ll get. Export in the format your system expects.
                    </p>

                    {/* Step flow */}
                    <div className="animate-fade-up-delay-2 mx-auto mt-8 flex max-w-xs items-center justify-center gap-0 sm:max-w-sm">
                        {STEPS.map((step, i) => (
                            <div key={step.n} className="flex items-center gap-0">
                                <div className="flex flex-col items-center">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-xs font-bold text-brand">
                                        {step.n}
                                    </span>
                                    <span className="mt-1.5 text-[0.75rem] font-semibold text-foreground">{step.label}</span>
                                    <span className="text-[0.65rem] text-muted-foreground">{step.sub}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="mx-3 mb-8 h-px w-8 flex-1 bg-gradient-to-r from-brand/40 to-brand/10 sm:w-12" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="animate-fade-up-delay-3 mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <input ref={inputRef} type="file" accept={LOCAL_ACCEPT} className="sr-only" onChange={onFile} />
                        <button
                            type="button"
                            onClick={onPickLocal}
                            className="group inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-brand-foreground shadow-[0_0_32px_hsl(var(--brand)/0.35)] transition-all duration-200 hover:bg-brand/90 hover:shadow-[0_0_40px_hsl(var(--brand)/0.45)]"
                        >
                            Get started free
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                        {isSignedIn ? (
                            <Link
                                href="/upload"
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-foreground transition-all hover:border-white/20 hover:bg-white/[0.07]"
                            >
                                <Cloud className="h-4 w-4 text-muted-foreground" />
                                Cloud upload
                            </Link>
                        ) : (
                            <SignInButton mode="modal">
                                <button
                                    type="button"
                                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-foreground transition-all hover:border-white/20 hover:bg-white/[0.07]"
                                >
                                    View a demo
                                </button>
                            </SignInButton>
                        )}
                    </div>

                    {/* Trust row */}
                    <div className="animate-fade-up-delay-4 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                            <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Error msg */}
                {msg && (
                    <p className="mx-auto mt-6 max-w-xl rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-center text-sm text-destructive">
                        {msg}
                    </p>
                )}

                {/* Company logos */}
                <div className="animate-fade-up-delay-4 mt-14 border-t border-white/[0.05] pt-8 text-center">
                    <p className="mb-5 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                        Trusted by data teams everywhere
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                        {LOGOS.map((logo) => (
                            <span
                                key={logo}
                                className="text-sm font-semibold tracking-tight text-muted-foreground/40 transition-colors hover:text-muted-foreground/60"
                            >
                                {logo}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Editor preview mockup ─────────────────── */}
            <section className="container max-w-7xl px-4 pb-20 sm:px-6">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 shadow-2xl shadow-black/40 backdrop-blur-md",
                        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:ring-1 before:ring-inset before:ring-white/[0.05]"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                >
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3">
                        <div className="flex gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-red-500/70" />
                            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                            <span className="h-3 w-3 rounded-full bg-green-500/70" />
                        </div>
                        <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                            Sample: CRM to Support Export
                            <span className="ml-1 text-brand">✓ Saved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="hidden rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground sm:block">
                                Load preset
                            </span>
                            <span className="hidden rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground sm:block">
                                Export
                            </span>
                        </div>
                    </div>

                    {/* 3-column body */}
                    <div className="grid divide-x divide-white/[0.04] sm:grid-cols-3">
                        {/* Source */}
                        <div className="p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
                            <p className="mb-1 text-[0.75rem] font-medium text-foreground">contacts.csv</p>
                            <p className="mb-3 text-[0.65rem] text-muted-foreground">CSV · 4 rows</p>
                            <div className="space-y-1.5">
                                {["cust_id", "email", "given_name", "family_name", "phone_dept_extension", "signup_date", "active"].map((f, i) => (
                                    <div key={f} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-white/[0.03]">
                                        <span className="text-[0.7rem] font-mono text-muted-foreground">{f}</span>
                                        <span className={cn("type-badge", i === 5 ? "type-date" : i === 6 ? "type-bool" : "type-str")}>
                                            {i === 5 ? "date" : i === 6 ? "bool" : "str"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mapping */}
                        <div className="p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mapping</p>
                            <div className="space-y-1.5">
                                {[
                                    ["cust_id", "customer.id"],
                                    ["email", "customer.email"],
                                    ["given_name", "customer.first_name"],
                                    ["family_name", "customer.last_name"],
                                    ["phone_dept_extension", "customer.phone"],
                                    ["signup_date", "customer.signed_up_at"],
                                    ["active", "customer.active"],
                                ].map(([src, tgt]) => (
                                    <div key={src} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/[0.03]">
                                        <span className="min-w-0 flex-1 truncate text-[0.7rem] font-mono text-muted-foreground">{src}</span>
                                        <span className="text-muted-foreground/30">→</span>
                                        <span className="min-w-0 flex-1 truncate text-right text-[0.7rem] font-mono text-brand/80">{tgt}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 text-center text-[0.65rem] text-brand">
                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                7 / 7 fields mapped
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target preview</p>
                            <div className="rounded-lg border border-white/[0.05] bg-background/60 p-3 font-mono text-[0.62rem] leading-relaxed text-muted-foreground">
                                <span className="text-brand/60">{"{"}</span>{"\n"}
                                {"  "}<span className="text-blue-400">&quot;customer&quot;</span>: <span className="text-brand/60">{"{"}</span>{"\n"}
                                {"    "}<span className="text-blue-400">&quot;id&quot;</span>: <span className="text-amber-400">&quot;101&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;email&quot;</span>: <span className="text-amber-400">&quot;alice@example.com&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;first_name&quot;</span>: <span className="text-amber-400">&quot;Alice&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;last_name&quot;</span>: <span className="text-amber-400">&quot;Anderson&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;phone&quot;</span>: <span className="text-amber-400">&quot;555-0181&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;signed_up_at&quot;</span>: <span className="text-amber-400">&quot;2024-01-15&quot;</span>,{"\n"}
                                {"    "}<span className="text-blue-400">&quot;active&quot;</span>: <span className="text-purple-400">true</span>{"\n"}
                                {"  "}<span className="text-brand/60">{"}"}</span>{"\n"}
                                <span className="text-brand/60">{"}"}</span>
                            </div>
                            <div className="mt-2 text-right">
                                <button className="text-[0.65rem] font-medium text-brand hover:underline">
                                    View full preview →
                                </button>
                            </div>
                        </div>
                    </div>

                    {dragging && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-brand/50 bg-brand/10 backdrop-blur-sm">
                            <Upload className="h-10 w-10 text-brand" />
                            <p className="text-sm font-semibold text-brand">Drop your file to start remapping</p>
                        </div>
                    )}
                </div>

                {/* Click to start */}
                <div className="mt-5 text-center">
                    <button
                        type="button"
                        onClick={onPickLocal}
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Upload className="h-4 w-4" />
                        Drop a file or click to upload
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground/50">CSV, TSV, JSON, XML, Excel · up to 4MB</p>
                </div>
            </section>

            {/* ── Three feature sections ─────────────────── */}
            <section className="border-t border-white/[0.05] py-20">
                <div className="container max-w-7xl px-4 sm:px-6">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        {/* Text */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-brand">From messy to mission-ready</p>
                            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                Everything you need to reshape your data
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                Map fields, rename paths, apply transforms, preview exactly what you&apos;ll get, and export in any format your systems require — all without leaving the browser.
                            </p>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {[
                                    { icon: Lock, title: "Local file", desc: "Fast, private, and secure. Files stay in your browser." },
                                    { icon: Cloud, title: "Cloud upload", desc: "Import from storage providers or via a link." },
                                    { icon: FileJson, title: "Multiple structures", desc: "Work with flat tables or nested JSON/XML paths." },
                                    { icon: RefreshCw, title: "Reusable presets", desc: "Save mappings and apply them across files and teams." },
                                    { icon: Zap, title: "Rich export formats", desc: "JSON, CSV, TSV, YAML, XML, or Excel." },
                                    { icon: CheckCircle2, title: "Preview & validate", desc: "See exactly how your data will look before export." },
                                ].map(({ icon: Icon, title, desc }) => (
                                    <div key={title} className="flex gap-3">
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
                                            <Icon className="h-4 w-4" aria-hidden />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{title}</p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Format + Presets panel */}
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/[0.06] bg-card/50 p-5 backdrop-blur-sm">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input formats</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {INPUT_FORMATS.map((f) => (
                                                <span key={f} className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-medium text-muted-foreground">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output formats</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {OUTPUT_FORMATS.map((f) => (
                                                <span key={f} className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-medium text-muted-foreground">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved presets</p>
                                        <div className="space-y-1.5">
                                            {PRESETS.map((p) => (
                                                <div key={p.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                                                    <p className="text-[0.7rem] font-medium text-foreground">{p.name}</p>
                                                    <p className="text-[0.6rem] text-muted-foreground">
                                                        <span className="format-badge format-json mr-1">{p.format}</span>
                                                        {p.updated}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-[0.7rem] text-muted-foreground/60">
                                    View all presets →
                                </p>
                            </div>

                            {/* Privacy badge */}
                            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-card/30 px-4 py-3">
                                <Lock className="h-3.5 w-3.5 text-brand" />
                                <p className="text-xs text-muted-foreground">
                                    <strong className="text-foreground">Built for privacy.</strong> Everything happens in your browser. Your data stays private.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
