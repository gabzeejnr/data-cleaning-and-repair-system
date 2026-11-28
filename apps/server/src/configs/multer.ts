import { createUpload } from "./upload.js";

const upload = createUpload({
    label: "CSV and XLSX",
    extensions: [".csv", ".xlsx"],
    mimetypes: [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    sizeMb: 10
})

const pdfUpload = createUpload({
    label: "PDF",
    extensions: [".pdf"],
    mimetypes: ["application/pdf"],
    sizeMb: 25,
    requireBoth: true
})





export { upload, pdfUpload };