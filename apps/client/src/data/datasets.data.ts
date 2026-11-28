import { File, FileSpreadsheet, FileText } from "lucide-react";
import type { UploadSupportedFormat } from "../types";


const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xls", ".xlsx", ".pdf"];


const supportedFormats: UploadSupportedFormat[] = [
    {
        title: "CSV",
        text: "Comma-separated values.",
        icon: FileText
    },
    {
        title: "Excel",
        text: ".xls and .xlsx workbooks.",
        icon: FileSpreadsheet
    },
    {
        title: "PDF",
        text: "PDF files with tables.",
        icon: File
    }
]

const whatHappensNext: string[] = [
    "Analyze your data structure",
    "Detect missing values, duplicates, and outliers",
    "Prepare data quality insights",
    "Help you clean and repair your data",
]

export { MAX_FILE_SIZE, ACCEPTED_EXTENSIONS, supportedFormats, whatHappensNext }