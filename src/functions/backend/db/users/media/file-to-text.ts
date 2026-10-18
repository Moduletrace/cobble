import TurndownService from "turndown";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
// import * as XLSX from "xlsx";
import bufferFromUrl from "@/src/utils/buffer-from-url";

const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

type Params = {
    file_stream?: Buffer<ArrayBuffer>;
    file_path?: string;
    /**
     * File extension, e.g. `pdf`, `docx`, `xlsx`
     */
    file_type?: string;
    url?: string;
};

export default async function fileToText({
    file_type,
    file_stream,
    file_path,
    url,
}: Params): Promise<string | undefined> {
    let buffer: Buffer | undefined;
    let ext: string;

    if (url) {
        const result = await bufferFromUrl(url);
        buffer = result.buffer;
        ext = result.ext;
    } else {
        buffer = file_path
            ? Buffer.from(await Bun.file(file_path).arrayBuffer())
            : file_stream;
        ext = (file_type || file_path?.split(".").pop() || "txt")
            .toString()
            .toLowerCase();
    }

    if (!buffer) return undefined;

    switch (ext) {
        case "docx": {
            const { value: html } = await mammoth.convertToHtml({ buffer });
            return turndownService.turndown(html);
        }

        case "pdf": {
            try {
                const pdfUintBuffer = new Uint8Array(buffer);
                const pdfDocProxy = await getDocumentProxy(pdfUintBuffer);
                const { text } = await extractText(pdfDocProxy, {
                    mergePages: true,
                });
                return text;
            } catch (err: any) {
                console.error(
                    `PDF text extraction failed: ${err?.message ?? err}`,
                );
                throw new Error(
                    `Failed to extract text from PDF: ${err?.message ?? "unknown error"}`,
                );
            }
        }

        // case "xlsx":
        // case "csv": {
        //     const workbook = XLSX.read(buffer, { type: "buffer" });
        //     return workbook.SheetNames.map((name) => {
        //         const sheet = workbook.Sheets[name];
        //         return `### Sheet: ${name}\n\n${XLSX.utils.sheet_to_csv(sheet!)}`;
        //     }).join("\n\n");
        // }

        case "md":
        case "txt":
        default:
            return buffer.toString("utf-8");
    }
}
