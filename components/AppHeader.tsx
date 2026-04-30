"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers, Upload } from "lucide-react";

const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Cloud upload" },
    { href: "/export", label: "Formats" },
];

export function AppHeader() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
            <div className="container flex h-[3.25rem] max-w-6xl items-center justify-between gap-4 px-4">
                <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
                    <Link
                        href="/"
                        className="group flex shrink-0 items-center gap-2 text-[0.95rem] font-semibold tracking-tight text-foreground"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/25 transition-colors group-hover:bg-brand/22">
                            <Layers className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="hidden sm:inline">Data Remap</span>
                    </Link>
                    <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
                        {nav.map((item) => {
                            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                                        active
                                            ? "bg-muted text-foreground shadow-sm ring-1 ring-border/80"
                                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        className="hidden h-8 rounded-full px-4 shadow-[0_0_0_1px_hsl(var(--brand)/0.35)] sm:inline-flex"
                        asChild
                    >
                        <Link href="/upload">
                            <Upload className="mr-1.5 h-3.5 w-3.5 opacity-90" />
                            New file
                        </Link>
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8 rounded-full px-3 sm:hidden" asChild>
                        <Link href="/upload">New</Link>
                    </Button>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-muted-foreground">
                                Sign in
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button size="sm" className="h-8 rounded-full px-3.5">
                                Sign up
                            </Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: { userButtonAvatarBox: "h-8 w-8 ring-2 ring-border/80" },
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
