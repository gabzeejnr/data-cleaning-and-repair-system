const PDF_SIGNATURE = Buffer.from("%PDF-");
const MAX_PDF_BYTES = 25 * 1024 * 1024;

export function validatePDF(buffer: Buffer): void {
    if (buffer.length === 0) {
        throw new Error("The uploaded PDF is empty.");
    }
    if (buffer.length > MAX_PDF_BYTES) {
        throw new Error("PDF exceeds the 25 MB limit.");
    }
    if (!buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
        throw new Error("File is not a valid PDF.");
    }
}