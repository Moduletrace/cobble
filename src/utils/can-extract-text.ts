import { BotTextFileExtensions } from "@/src/dict/bot-file-dict";
import extensionOf from "./extension-of";

type Params = {
    /**
     * The file's name, e.g. `invoice.pdf`.
     */
    name?: string | null;
    /**
     * Its MIME type, for a file with no extension in its name.
     */
    mime_type?: string | null;
};

/**
 * Whether a file's text is worth extracting and keeping on its `media` row.
 *
 * Only the extensions the local extractor really unpacks count
 * (`BotTextFileExtensions`). Everything else - a zip, an SVG, a
 * spreadsheet, a binary with an unknown name - has no text to store, and
 * decoding its bytes anyway is how raw file content ended up in the
 * database.
 */
export default function canExtractText({ name, mime_type }: Params): boolean {
    const ext = extensionOf({ name, mime_type });

    if (!ext) return false;

    return (BotTextFileExtensions as readonly string[]).includes(ext);
}
