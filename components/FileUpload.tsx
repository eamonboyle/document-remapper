import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

export function FileUpload() {
    const router = useRouter();

    return (
        <UploadButton
            endpoint="documentUploader"
            appearance={{
                button:
                    "!w-full ut-ready:bg-primary ut-ready:text-primary-foreground ut-ready:border-0 ut-uploading:bg-muted ut-uploading:cursor-wait rounded-xl px-6 py-3 text-sm font-medium shadow-md transition-all",
                allowedContent: "ut-uploading:!hidden text-muted-foreground text-xs !text-center !mt-3",
                container: "w-full justify-center flex flex-col items-stretch gap-2",
            }}
            content={{
                button: ({ ready }) => (ready ? "Choose file · up to 8MB" : "Preparing upload…"),
            }}
            onClientUploadComplete={(res) => {
                if (res && res[0]) {
                    const name = res[0].name ? `&name=${encodeURIComponent(res[0].name)}` : "";
                    router.push(`/remap?fileUrl=${encodeURIComponent(res[0].url)}${name}`);
                } else {
                    alert("Upload completed, but no file information received.");
                }
            }}
            onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
            }}
        />
    );
}
