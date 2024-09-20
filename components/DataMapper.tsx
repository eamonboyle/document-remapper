"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { Moon, Sun, Download, Undo, Redo, Save, Upload } from "lucide-react";
import Link from "next/link";

interface DataMapperProps {
    fileUrl: string;
}

interface Mapping {
    original: string;
    remapped: string;
}

interface AdvancedSettings {
    caseSensitive: boolean;
    trimWhitespace: boolean;
}

export function DataMapper({ fileUrl }: DataMapperProps) {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [remappedPreview, setRemappedPreview] = useState<string>("");
    const [fileType, setFileType] = useState<"csv" | "xml" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(true); // Set dark mode as default
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
        caseSensitive: false,
        trimWhitespace: true,
    });
    const [mappingHistory, setMappingHistory] = useState<Mapping[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchFileContent = async () => {
            try {
                const response = await fetch(fileUrl);
                const content = await response.text();
                setFileContent(content);
                const type = detectFileType(content);
                setFileType(type);
                const detectedMappings = detectMappings(content, type);
                setMappings(detectedMappings);
                updateRemappedPreview(detectedMappings, content, type);
                setMappingHistory([detectedMappings]);
                setHistoryIndex(0);
            } catch (error) {
                console.error("Error fetching file content:", error);
                setError("Failed to fetch file content. Please try again.");
            }
        };

        fetchFileContent();
    }, [fileUrl]);

    const detectFileType = (content: string): "csv" | "xml" | null => {
        if (content.trim().startsWith("<?xml")) {
            return "xml";
        } else if (content.includes(",")) {
            return "csv";
        }
        return null;
    };

    const detectMappings = (content: string, type: "csv" | "xml" | null): Mapping[] => {
        if (type === "csv") {
            const result = Papa.parse(content, { header: true });
            if (result.data && result.data.length > 0) {
                return Object.keys(result.data[0]).map((header) => ({ original: header, remapped: "" }));
            }
        } else if (type === "xml") {
            const parser = new XMLParser({ ignoreAttributes: false });
            const result = parser.parse(content);

            const extractMappings = (obj: Record<string, unknown>, prefix = ""): Mapping[] => {
                let mappings: Mapping[] = [];
                for (const [key, value] of Object.entries(obj)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    mappings.push({ original: fullKey, remapped: "" });

                    if (typeof value === "object" && value !== null) {
                        if (Array.isArray(value)) {
                            // Handle array elements
                            mappings = mappings.concat(extractMappings(value[0], fullKey));
                        } else {
                            // Handle nested objects
                            mappings = mappings.concat(extractMappings(value as Record<string, unknown>, fullKey));
                        }
                    }
                }
                return mappings;
            };

            return extractMappings(result);
        }
        return [];
    };

    const updateRemappedPreview = useCallback(
        (currentMappings: Mapping[], content: string | null, type: "csv" | "xml" | null) => {
            if (content && type) {
                let preview = content;
                if (type === "csv") {
                    const result = Papa.parse(content, { header: true });
                    const remappedData = result.data.map((row: Record<string, string>) => {
                        const newRow: Record<string, string> = {};
                        currentMappings.forEach((mapping) => {
                            let value = row[mapping.original];
                            if (advancedSettings.trimWhitespace) {
                                value = value.trim();
                            }
                            if (mapping.remapped) {
                                newRow[mapping.remapped] = value;
                            } else {
                                newRow[mapping.original] = value;
                            }
                        });
                        return newRow;
                    });
                    preview = Papa.unparse(remappedData);
                } else if (type === "xml") {
                    const parser = new XMLParser({ ignoreAttributes: false });
                    const result = parser.parse(content);

                    const remapObject = (obj: Record<string, unknown>, prefix = ""): Record<string, unknown> => {
                        const newObj: Record<string, unknown> = {};
                        for (const [key, value] of Object.entries(obj)) {
                            const fullKey = prefix ? `${prefix}.${key}` : key;
                            const mapping = currentMappings.find((m) => m.original === fullKey);
                            const newKey = mapping && mapping.remapped ? mapping.remapped : key;

                            if (typeof value === "object" && value !== null) {
                                if (Array.isArray(value)) {
                                    newObj[newKey] = value.map((item) => remapObject(item, fullKey));
                                } else {
                                    newObj[newKey] = remapObject(value as Record<string, unknown>, fullKey);
                                }
                            } else {
                                newObj[newKey] = value;
                            }
                        }
                        return newObj;
                    };

                    const remappedData = remapObject(result);
                    preview = convertXmlToString(remappedData);
                }
                setRemappedPreview(preview);
            }
        },
        [advancedSettings]
    );

    const convertXmlToString = (obj: Record<string, unknown>): string => {
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            format: true,
            indentBy: "  ",
        });
        return builder.build(obj);
    };

    const handleRemapChange = useCallback(
        (index: number, value: string) => {
            setMappings((prevMappings) => {
                const newMappings = [...prevMappings];
                newMappings[index].remapped = value;

                setMappingHistory((prevHistory) => {
                    const newHistory = prevHistory.slice(0, historyIndex + 1);
                    newHistory.push(newMappings);
                    return newHistory;
                });

                setHistoryIndex((prevIndex) => prevIndex + 1);

                updateRemappedPreview(newMappings, fileContent, fileType);

                return newMappings;
            });
        },
        [fileContent, fileType, historyIndex, updateRemappedPreview]
    );

    const saveMappings = async () => {
        try {
            const mappingsJson = JSON.stringify(mappings);
            const blob = new Blob([mappingsJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mappings.json";
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error saving mappings:", error);
            setError("Failed to save mappings. Please try again.");
        }
    };

    const loadMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedMappings = JSON.parse(e.target?.result as string);
                    setMappings(loadedMappings);
                    updateRemappedPreview(loadedMappings, fileContent, fileType);
                } catch (error) {
                    console.log(error);
                    setError("Failed to load mappings. Invalid file format.");
                }
            };
            reader.readAsText(file);
        }
    };

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const newMappings = mappingHistory[newIndex];
            setMappings(newMappings);
            updateRemappedPreview(newMappings, fileContent, fileType);
        }
    }, [historyIndex, mappingHistory, updateRemappedPreview, fileContent, fileType]);

    const redo = useCallback(() => {
        if (historyIndex < mappingHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const newMappings = mappingHistory[newIndex];
            setMappings(newMappings);
            updateRemappedPreview(newMappings, fileContent, fileType);
        }
    }, [historyIndex, mappingHistory, updateRemappedPreview, fileContent, fileType]);

    const downloadRemappedFile = () => {
        const blob = new Blob([remappedPreview], { type: fileType === "csv" ? "text/csv" : "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `remapped_file.${fileType}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredMappings = mappings.filter(
        (mapping) =>
            mapping.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.remapped.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    return (
        <div className={`flex flex-col p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Data Mapper</h1>
                <div>
                    <Button onClick={() => setDarkMode(!darkMode)} className="mr-2">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Button onClick={downloadRemappedFile} className="mr-2">
                        <Download size={20} />
                    </Button>
                    <Button onClick={undo} disabled={historyIndex <= 0} className="mr-2">
                        <Undo size={20} />
                    </Button>
                    <Button onClick={redo} disabled={historyIndex >= mappingHistory.length - 1} className="mr-2">
                        <Redo size={20} />
                    </Button>
                    <Button onClick={saveMappings} className="mr-2">
                        <Save size={20} />
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Original Document ({fileType?.toUpperCase()})</h2>
                        <label className="cursor-pointer">
                            <Link href="/upload">
                                <Button size="sm">
                                    <Upload size={16} className="mr-2" />
                                    Upload New
                                </Button>
                            </Link>
                            <input type="file" className="hidden" onChange={loadMappings} accept=".json" />
                        </label>
                    </div>
                    <pre className={`p-4 rounded mt-2 h-64 overflow-auto ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                        {fileContent}
                    </pre>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-3">Remapped Preview</h2>
                    <pre className={`p-4 rounded mt-2 h-64 overflow-auto ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                        {remappedPreview}
                    </pre>
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Mappings</h2>
                <input
                    type="text"
                    placeholder="Search mappings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full p-2 mb-4 rounded ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
                />
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left pb-2">Original</th>
                            <th className="text-left pb-2">Remapped</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMappings.map((mapping, index) => (
                            <tr key={index}>
                                <td className="py-2">{mapping.original}</td>
                                <td>
                                    <input
                                        title={`Remap Value ${index + 1}`}
                                        type="text"
                                        value={mapping.remapped}
                                        placeholder={mapping.original}
                                        onChange={(e) => handleRemapChange(index, e.target.value)}
                                        className={`border rounded px-2 py-1 w-full ${
                                            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
                                        }`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
                <label className="block mb-2">
                    <input
                        type="checkbox"
                        checked={advancedSettings.caseSensitive}
                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, caseSensitive: e.target.checked })}
                        className="mr-2"
                    />
                    Case Sensitive
                </label>
                <label className="block mb-2">
                    <input
                        type="checkbox"
                        checked={advancedSettings.trimWhitespace}
                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, trimWhitespace: e.target.checked })}
                        className="mr-2"
                    />
                    Trim Whitespace
                </label>
            </div>
        </div>
    );
}
