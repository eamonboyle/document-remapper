import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AppSubpage({
    icon: Icon,
    eyebrow,
    title,
    description,
    children,
}: {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <div className="container max-w-3xl px-4 py-12 sm:py-16">
            <div className="mb-8 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border/70">
                    <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
