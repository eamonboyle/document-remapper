"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { saveRemapPayload } from "@/lib/remapPayloadStore";
import { FileJson, Table2, Upload } from "lucide-react";

const LOCAL_ACCEPT = ".csv,.tsv,.tab,.json,.jsonl,.ndjson,.xml,.xlsx,.xls,.txt,application/json,text/csv";

const MAX_IDB = 20 * 1024 * 1024;

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
            if (file.size > MAX_IDB) {
                setMsg(
                    "This file is very large. Use the map page’s “Replace file” to load it, or use cloud upload."
                );
                return;
            }
            setMsg(null);
            const name = file.name;
            const isXlsx = /\.(xlsx|xls)$/i.test(name);
            if (isXlsx) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const d = reader.result;
                    if (typeof d !== "string") return;
                    const b64 = d.split(",")[1] ?? d;
                    try {
                        const r = await saveRemapPayload({ kind: "binary", fileName: name, base64: b64 });
                        const q = r.useUrlKey && r.key ? `&key=${encodeURIComponent(r.key)}` : "";
                        router.push(`/remap?source=local${q}`);
                    } catch (er) {
                        setMsg(
                            er instanceof Error
                                ? er.message
                                : "Could not store the file. Try the map page’s “Replace file” for large workbooks."
                        );
                    }
                };
                reader.readAsDataURL(file);
            } else {
                const reader = new FileReader();
                reader.onload = async () => {
                    const t = reader.result;
                    if (typeof t !== "string") return;
                    try {
                        const r = await saveRemapPayload({ kind: "text", fileName: name, text: t });
                        const q = r.useUrlKey && r.key ? `&key=${encodeURIComponent(r.key)}` : "";
                        router.push(`/remap?source=local${q}`);
                    } catch (er) {
                        setMsg(er instanceof Error ? er.message : "Storage failed. Try a smaller file or Replace file on the map page.");
                    }
                };
                reader.readAsText(file, "UTF-8");
            }
        },
        [router]
    );

    return (
        <div className="container max-w-3xl px-4 py-12">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Data pipeline</div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Remap any import to your system</h1>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Load CSV, TSV, JSON, XML, Excel, or JSON Lines, rename fields, apply Jexl transforms, filter rows, then
                export to JSON, CSV, TSV, YAML, XML, or another Excel. Save a mapping preset and reapply for recurring
                vendor files.
            </p>

            {msg && <p className="text-destructive border-destructive/30 bg-destructive/5 mb-6 rounded-md border p-3 text-sm">{msg}</p>}

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <input ref={inputRef} type="file" accept={LOCAL_ACCEPT} className="sr-only" onChange={onFile} />
                <Button size="lg" onClick={onPickLocal}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Choose a file
                </Button>
                {isSignedIn ? (
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Cloud upload
                        </Link>
                    </Button>
                ) : null}
            </div>

            <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                    <Table2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        <strong className="text-foreground">Tabular:</strong> map columns, add transforms per field (Jexl), and optional
                        row filter (Jexl over <code className="text-xs">c</code> / <code className="text-xs">row</code>).
                    </span>
                </li>
                <li className="flex items-start gap-2">
                    <FileJson className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        <strong className="text-foreground">JSON / XML:</strong> all paths are discovered (async for huge trees); add
                        custom source paths that were not auto-listed.
                    </span>
                </li>
            </ul>

            <p className="text-muted-foreground mt-4 text-xs">
                Large workbooks and files are kept in your browser (IndexedDB when over ~1.2MB JSON), not sent to the app server.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
                {isSignedIn ? (
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                ) : (
                    <SignInButton mode="modal">
                        <Button variant="outline">Sign in to use cloud upload (optional)</Button>
                    </SignInButton>
                )}
                <SignedIn>
                    <Button variant="ghost" asChild>
                        <Link href="/export">Export &amp; formats</Link>
                    </Button>
                </SignedIn>
            </div>
        </div>
    );
}
