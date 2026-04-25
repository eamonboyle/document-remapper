"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { setRemapSession } from "@/lib/remapSession";
import { FileJson, Table2, Upload } from "lucide-react";

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
        <div className="container max-w-3xl px-4 py-12">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Data pipeline</div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Remap any import to your system</h1>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Load CSV, TSV, JSON, XML, Excel, or JSON Lines, rename fields, then export to JSON, CSV, TSV, YAML, XML, or
                another Excel. Save a mapping preset and apply it the next time the same vendor file arrives.
            </p>

            {msg && <p className="text-destructive border-destructive/30 bg-destructive/5 mb-6 rounded-md border p-3 text-sm">{msg}</p>}

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={LOCAL_ACCEPT}
                    className="sr-only"
                    onChange={onFile}
                />
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
                        <strong className="text-foreground">Tabular:</strong> map each column to a target name (your canonical fields).
                    </span>
                </li>
                <li className="flex items-start gap-2">
                    <FileJson className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        <strong className="text-foreground">Hierarchical (JSON / XML):</strong> set destination paths; export flattens
                        to CSV or keeps structure as JSON, YAML, or XML.
                    </span>
                </li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-4">
                {isSignedIn ? (
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                ) : (
                    <SignInButton mode="modal">
                        <Button variant="outline">Sign in to sync uploads (optional)</Button>
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
