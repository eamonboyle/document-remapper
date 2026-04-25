"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { FileInput, LayoutGrid } from "lucide-react";

const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Cloud upload" },
    { href: "/export", label: "Formats" },
];

export function AppHeader() {
    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur">
            <div className="container flex h-14 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                        <LayoutGrid className="h-4 w-4" aria-hidden />
                        Data Remap
                    </Link>
                    <nav className="hidden gap-4 sm:flex" aria-label="Main">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/upload">
                            <FileInput className="mr-1.5 h-3.5 w-3.5" />
                            New file
                        </Link>
                    </Button>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="ghost" size="sm">
                                Sign in
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button size="sm">Sign up</Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
