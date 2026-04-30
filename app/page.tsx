"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { setRemapSession } from "@/lib/remapSession";
import { ArrowRight, Cloud, FileJson, Table2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_ACCEPT = ".csv,.tsv,.tab,.json,.jsonl,.ndjson,.xml,.xlsx,.xls,.txt,application/json,text/csv";

export default function Home() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const onPickLocal = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const onFile = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) {
                setMsg("This file is larger than 4MB. Open the map screen and use “Replace file”, or use cloud upload on the upload page.");
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
                        setMsg(
                            er instanceof Error
                                ? er.message
                                : "Could not store the file. Use “Replace file” on the map screen for large Excel files."
                        );
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

    return (
        <div className="container max-w-5xl px-4 py-14 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                    Import → map → export
                </p>
                <h1 className="animate-fade-up-delay-1 mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
                    Remap any file to your system’s shape
                </h1>
                <p className="animate-fade-up-delay-2 mt-5 text-balance text-lg leading-relaxed text-muted-foreground">
                    Load CSV, TSV, JSON, XML, Excel, or JSON Lines, rename fields or paths, then export to JSON, CSV, TSV, YAML, XML, or
                    Excel. Save a preset and reuse it whenever the same vendor format lands.
                </p>
            </div>

            {msg && (
                <p className="animate-fade-up-delay-2 mx-auto mt-8 max-w-2xl rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                    {msg}
                </p>
            )}

            <div className="animate-fade-up-delay-3 mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
                <input ref={inputRef} type="file" accept={LOCAL_ACCEPT} className="sr-only" onChange={onFile} />
                <button
                    type="button"
                    onClick={onPickLocal}
                    className={cn(
                        "group relative flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-card/60 p-6 text-left shadow-lg shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-md transition-all duration-300 hover:border-brand/35 hover:bg-card/80 hover:shadow-xl hover:shadow-brand/5"
                    )}
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/20">
                        <FileJson className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Local file</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Stays in your browser. Fast path for sensitive data — no account required.
                        </p>
                    </div>
                    <span className="inline-flex items-center text-sm font-medium text-brand">
                        Choose a file
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                </button>

                {isSignedIn ? (
                    <Link
                        href="/upload"
                        className={cn(
                            "group relative flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-card/40 p-6 text-left shadow-md shadow-black/15 ring-1 ring-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card/60 hover:shadow-lg"
                        )}
                    >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/60">
                            <Cloud className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Cloud upload</h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Store with your provider and open from a link — handy for larger files or sharing.
                            </p>
                        </div>
                        <span className="inline-flex items-center text-sm font-medium text-foreground">
                            Open upload
                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                    </Link>
                ) : (
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-border/90 bg-muted/25 p-6">
                        <div className="flex gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/80 text-muted-foreground ring-1 ring-border/70">
                                <Cloud className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Cloud upload</h2>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Optional sign-in unlocks hosted uploads when you configure storage.
                                </p>
                            </div>
                        </div>
                        <SignInButton mode="modal">
                            <Button variant="secondary" size="lg" className="w-full rounded-xl sm:w-auto">
                                Sign in to enable
                            </Button>
                        </SignInButton>
                    </div>
                )}
            </div>

            <ul className="mx-auto mt-14 grid max-w-3xl gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-3 backdrop-blur-sm">
                    <Table2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span>
                        <strong className="font-medium text-foreground">Tabular:</strong> map each column to your canonical field names.
                    </span>
                </li>
                <li className="flex gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-3 backdrop-blur-sm">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span>
                        <strong className="font-medium text-foreground">JSON / XML:</strong> set destination paths; export keeps structure or
                        flattens for CSV.
                    </span>
                </li>
            </ul>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                {isSignedIn ? (
                    <Button variant="outline" size="lg" className="rounded-xl" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                ) : (
                    <SignInButton mode="modal">
                        <Button variant="outline" size="lg" className="rounded-xl">
                            Sign in (optional)
                        </Button>
                    </SignInButton>
                )}
                <SignedIn>
                    <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground" asChild>
                        <Link href="/export">Export formats</Link>
                    </Button>
                </SignedIn>
            </div>
        </div>
    );
}
