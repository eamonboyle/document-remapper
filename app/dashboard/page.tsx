"use client";

import { useAuth, SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    FileStack,
    Cloud,
    LayoutTemplate,
    Clock,
    Star,
    Activity,
    Settings,
    Home,
    Files,
    FolderOpen,
    Download,
    Upload,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Zap,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sideNav = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/", icon: FileStack, label: "Mappings" },
    { href: "/upload", icon: Files, label: "Connectors" },
    { href: "/export", icon: FolderOpen, label: "Presets" },
    { href: "/dashboard", icon: Settings, label: "Settings" },
];

const recentDocs = [
    { name: "sample-contacts.csv", format: "CSV", rows: "4 rows", when: "Just now", color: "format-csv" },
    { name: "orders-export.json", format: "JSON", rows: "953 rows", when: "2h ago", color: "format-json" },
    { name: "inventory-feed.xml", format: "XML", rows: "1,204 rows", when: "Yesterday", color: "format-xml" },
    { name: "leads-export.csv", format: "CSV", rows: "532 rows", when: "2d ago", color: "format-csv" },
    { name: "products.xlsx", format: "XLSX", rows: "1,097 rows", when: "2d ago", color: "format-xlsx" },
];

const favMappings = [
    { name: "Salesforce Contacts", format: "JSON", when: "Updated 2d ago" },
    { name: "NetSuite Items", format: "CSV", when: "Updated 1h ago" },
    { name: "HubSpot Companies", format: "JSON", when: "Updated 2w ago" },
    { name: "Zendesk Tickets", format: "JSON", when: "Updated 3w ago" },
];

const connections = [
    { name: "Amazon S3", user: "alex-bucket", status: "Connected", icon: "S3" },
    { name: "Google Cloud", user: "acme-data", status: "Connected", icon: "GC" },
    { name: "Dropbox", user: "alex@acme.com", status: "Connected", icon: "DB" },
    { name: "OneDrive", user: "acme-workspace", status: "Connected", icon: "OD" },
];

const activity = [
    { text: 'Mapping "Salesforce Contacts" exported successfully', when: "Just now", type: "success" },
    { text: "Document orders-export.json processed", when: "2h ago", type: "info" },
    { text: 'Mapping "NetSuite Items" previewed', when: "3h ago", type: "info" },
];

function FormatBadge({ fmt }: { fmt: string }) {
    const cls: Record<string, string> = {
        CSV: "format-csv",
        JSON: "format-json",
        XML: "format-xml",
        XLSX: "format-xlsx",
        YAML: "format-yaml",
    };
    return <span className={cn("format-badge", cls[fmt] ?? "format-json")}>{fmt}</span>;
}

function ConnIcon({ icon }: { icon: string }) {
    const colors: Record<string, string> = {
        S3: "bg-orange-500/15 text-orange-400",
        GC: "bg-blue-500/15 text-blue-400",
        DB: "bg-sky-500/15 text-sky-400",
        OD: "bg-cyan-500/15 text-cyan-400",
    };
    return (
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-[0.6rem] font-bold", colors[icon] ?? "bg-brand/10 text-brand")}>
            {icon}
        </span>
    );
}

export default function Dashboard() {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const firstName = user?.firstName ?? "Alex";

    if (!isSignedIn) {
        return (
            <div className="container max-w-lg px-4 py-16 sm:py-24">
                <div className="rounded-2xl border border-white/[0.06] bg-card/50 p-8 shadow-xl shadow-black/30 ring-1 ring-white/[0.04] backdrop-blur-md">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
                        <Home className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Your workspace</h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        Sign in to access your dashboard, saved mappings, cloud uploads, and activity history.
                    </p>
                    <div className="mt-8">
                        <SignInButton mode="modal">
                            <Button size="lg" className="rounded-xl bg-brand px-8 font-semibold text-brand-foreground hover:bg-brand/90">
                                Sign in
                            </Button>
                        </SignInButton>
                    </div>
                </div>
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="flex min-h-[calc(100vh-3.375rem)]">
            {/* ── Sidebar ─────────────────────────────── */}
            <aside className="hidden w-52 shrink-0 flex-col border-r border-white/[0.05] bg-card/30 backdrop-blur-md lg:flex">
                <div className="px-4 py-5">
                    <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/60">Pro Workspace</p>
                </div>
                <nav className="flex-1 px-2">
                    {sideNav.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={label}
                            href={href}
                            className={cn(
                                "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-medium transition-colors",
                                label === "Home"
                                    ? "bg-brand/10 text-brand"
                                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" aria-hidden />
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="border-t border-white/[0.05] p-4">
                    <p className="text-[0.7rem] text-muted-foreground/60">
                        {user?.primaryEmailAddress?.emailAddress ?? ""}
                    </p>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────── */}
            <div className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                    {/* Header row */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {greeting}, {firstName} 👋
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">What do you want to remap today?</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" className="gap-1.5 rounded-lg bg-brand text-xs font-semibold text-brand-foreground hover:bg-brand/90" asChild>
                                <Link href="/"><Upload className="h-3.5 w-3.5" /> New</Link>
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-lg text-xs text-muted-foreground">
                                ···
                            </Button>
                        </div>
                    </div>

                    {/* Quick action cards */}
                    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            { href: "/", icon: FileStack, label: "Map a file", desc: "Upload or pick a file · CSV, JSON, XML, Excel…", accent: true },
                            { href: "/upload", icon: Cloud, label: "Cloud upload", desc: "Import from cloud storage · S3, GCS, Dropbox…", accent: false },
                            { href: "/export", icon: LayoutTemplate, label: "Use a preset", desc: "Start from a saved mapping. Save time and ship faster.", accent: false },
                        ].map(({ href, icon: Icon, label, desc, accent }) => (
                            <Link
                                key={label}
                                href={href}
                                className={cn(
                                    "group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200",
                                    accent
                                        ? "border-brand/25 bg-brand/8 hover:border-brand/40 hover:bg-brand/12"
                                        : "border-white/[0.06] bg-card/40 hover:border-white/[0.1] hover:bg-card/60"
                                )}
                            >
                                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", accent ? "bg-brand/15 text-brand ring-brand/25" : "bg-white/[0.04] text-muted-foreground ring-white/[0.06]")}>
                                    <Icon className="h-4 w-4" aria-hidden />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{label}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* 2-col grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recent documents */}
                        <div className="rounded-xl border border-white/[0.06] bg-card/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                                <p className="text-sm font-semibold">Recent documents</p>
                                <button className="text-xs text-brand hover:underline">View all →</button>
                            </div>
                            <div className="divide-y divide-white/[0.04]">
                                {recentDocs.map((doc) => (
                                    <div key={doc.name} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                                        <FormatBadge fmt={doc.format} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[0.8125rem] font-medium text-foreground">{doc.name}</p>
                                            <p className="text-[0.7rem] text-muted-foreground">{doc.rows}</p>
                                        </div>
                                        <span className="shrink-0 text-[0.7rem] text-muted-foreground/60">{doc.when}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Favorite mappings */}
                        <div className="rounded-xl border border-white/[0.06] bg-card/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                                <p className="text-sm font-semibold">Favorite mappings</p>
                                <button className="text-xs text-brand hover:underline">View all →</button>
                            </div>
                            <div className="divide-y divide-white/[0.04]">
                                {favMappings.map((m) => (
                                    <div key={m.name} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                                        <FormatBadge fmt={m.format} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[0.8125rem] font-medium text-foreground">{m.name}</p>
                                            <p className="text-[0.7rem] text-muted-foreground">{m.when}</p>
                                        </div>
                                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Connections */}
                        <div className="rounded-xl border border-white/[0.06] bg-card/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                                <p className="text-sm font-semibold">Connections</p>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-white/[0.03] p-px">
                                {connections.map((c) => (
                                    <div key={c.name} className="flex items-center gap-3 bg-card/40 p-4">
                                        <ConnIcon icon={c.icon} />
                                        <div className="min-w-0">
                                            <p className="text-[0.8125rem] font-medium text-foreground">{c.name}</p>
                                            <p className="truncate text-[0.65rem] text-muted-foreground">{c.user}</p>
                                            <p className="text-[0.65rem] text-brand">{c.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity feed + tips */}
                        <div className="space-y-4">
                            <div className="rounded-xl border border-white/[0.06] bg-card/40 backdrop-blur-sm">
                                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                                    <p className="text-sm font-semibold">Activity feed</p>
                                    <button className="text-xs text-brand hover:underline">View all activity →</button>
                                </div>
                                <div className="divide-y divide-white/[0.04]">
                                    {activity.map((a, i) => (
                                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                                            {a.type === "success" ? (
                                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                                            ) : (
                                                <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[0.8125rem] text-foreground/80">{a.text}</p>
                                            </div>
                                            <span className="shrink-0 text-[0.7rem] text-muted-foreground/50">{a.when}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl border border-brand/15 bg-brand/5 p-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                                    <Zap className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Tips &amp; tricks</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                        Learn how to build complex mappings with nested paths, transformations, and conditional logic.
                                    </p>
                                    <Link href="/export" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                                        Open docs <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
