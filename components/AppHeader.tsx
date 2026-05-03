"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

const appNav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Cloud upload" },
    { href: "/export", label: "Formats" },
];

const marketingNav = [
    { href: "/", label: "Product" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
];

export function AppHeader() {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-[3.375rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                {/* Logo */}
                <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
                    <Link
                        href="/"
                        className="group flex shrink-0 items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight text-foreground"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/25 transition-all group-hover:bg-brand/20 group-hover:ring-brand/40">
                            <Layers className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="hidden sm:inline">Data Remap</span>
                    </Link>

                    {/* Nav */}
                    {isLanding ? (
                        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
                            {marketingNav.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    ) : (
                        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Main">
                            {appNav.map((item) => {
                                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
                                            active
                                                ? "bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-4 text-[0.8125rem] text-muted-foreground hover:text-foreground"
                            >
                                Sign in
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button
                                size="sm"
                                className="h-8 rounded-full bg-brand px-4 text-[0.8125rem] font-semibold text-brand-foreground hover:bg-brand/90"
                            >
                                Create account
                            </Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="hidden h-8 rounded-full px-4 text-[0.8125rem] text-muted-foreground hover:text-foreground sm:inline-flex"
                            asChild
                        >
                            <Link href="/">New remap</Link>
                        </Button>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "h-8 w-8 ring-1 ring-white/10",
                                },
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
