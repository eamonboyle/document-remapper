import { ExportOptions } from "@/components/ExportOptions";

export default function ExportPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Export Document</h1>
            <ExportOptions />
        </div>
    );
}
