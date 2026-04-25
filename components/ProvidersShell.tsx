import { AppHeader } from "@/components/AppHeader";

export function ProvidersShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
        </div>
    );
}
