import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ProvidersShell } from "@/components/ProvidersShell";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Data Remap | Import → map → export",
    description: "Map fields from CSV, TSV, JSON, XML, Excel, or JSON Lines to your target format and download.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" className={`dark ${outfit.variable}`}>
                <body className="min-h-screen font-sans antialiased">
                    <ProvidersShell>{children}</ProvidersShell>
                </body>
            </html>
        </ClerkProvider>
    );
}
