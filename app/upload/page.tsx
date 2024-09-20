"use client";

import { FileUpload } from "@/components/FileUpload";

export default function UploadPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Upload Document</h1>
            <div className="max-w-md mx-auto bg-gray-800 shadow-md rounded-lg p-6">
                <p className="text-white mb-4">Please select a CSV or XML file to upload. Maximum file size is 4MB.</p>
                <FileUpload />
            </div>
        </div>
    );
}
