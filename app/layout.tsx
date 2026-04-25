import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProvidersShell } from "@/components/ProvidersShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Data Remap | Import → map → export",
    description: "Map fields from CSV, TSV, JSON, XML, Excel, or JSON Lines to your target format and download.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" className="dark">
                <body className={`${inter.className} min-h-screen antialiased`}>
                    <ProvidersShell>{children}</ProvidersShell>
                </body>
            </html>
        </ClerkProvider>
    );
}
