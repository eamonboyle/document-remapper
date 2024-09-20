import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

export function FileUpload() {
    const router = useRouter();

    return (
        <UploadButton
            endpoint="documentUploader"
            onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                if (res && res[0]) {
                    // Redirect to the remapper page with the file URL as a query parameter
                    router.push(`/remap?fileUrl=${encodeURIComponent(res[0].url)}`);
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
