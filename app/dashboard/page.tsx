"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileStack, HardDrive, LayoutTemplate } from "lucide-react";

const actions = [
    {
        href: "/",
        title: "Map a file",
        description: "Pick a local file and define field mappings in the browser.",
        icon: FileStack,
        primary: true,
    },
    {
        href: "/upload",
        title: "Upload to cloud",
        description: "Send files to your configured storage, then open them in the mapper.",
        icon: HardDrive,
        primary: false,
    },
    {
        href: "/export",
        title: "Export formats",
        description: "See supported output types and how presets fit your workflow.",
        icon: LayoutTemplate,
        primary: false,
    },
] as const;

export default function Dashboard() {
    const { isSignedIn, userId } = useAuth();

    if (!isSignedIn) {
        return (
            <div className="container max-w-lg px-4 py-16 sm:py-24">
                <div className="rounded-2xl border border-border/70 bg-card/50 p-8 shadow-xl shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-md">
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        Sign in to use cloud upload and keep your workspace tools in one place.
                    </p>
                    <div className="mt-8">
                        <SignInButton mode="modal">
                            <Button size="lg" className="rounded-xl px-8">
                                Sign in
                            </Button>
                        </SignInButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl px-4 py-12 sm:py-16">
            <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Workspace</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your pipeline</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                    This app processes files in the browser. Cloud upload sends files to your configured storage so you can share links. For
                    fully local work, use the home page.
                </p>
                {userId ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-[0.7rem] text-muted-foreground">
                        <span className="text-[0.65rem] font-sans font-medium uppercase tracking-wider text-muted-foreground/80">Session</span>
                        <span className="truncate">{userId}</span>
                    </p>
                ) : null}
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map(({ href, title, description, icon: Icon, primary }) => (
                    <li key={href}>
                        <Link
                            href={href}
                            className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/45 p-5 shadow-md shadow-black/15 ring-1 ring-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-brand/30 hover:bg-card/65 hover:shadow-lg sm:min-h-[11.5rem]"
                        >
                            <span
                                className={
                                    primary
                                        ? "flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25"
                                        : "flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/70"
                                }
                            >
                                <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
                            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                            <span className="mt-4 inline-flex items-center text-sm font-medium text-brand">
                                Open
                                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
