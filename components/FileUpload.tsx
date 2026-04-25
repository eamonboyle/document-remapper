import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

export function FileUpload() {
    const router = useRouter();

    return (
        <UploadButton
            endpoint="documentUploader"
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
