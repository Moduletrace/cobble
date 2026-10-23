import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * The text extracted from a file.
     */
    text: string;
};

/**
 * Extracted document text, cut to what the `media` row keeps
 * (`AppData.BotAttachmentTextStoreMaxChars`) with a line saying so.
 *
 * The column is a cache, not a copy of the file: a 20 MB document would
 * otherwise put 20 MB of text into the database, and no reader takes more
 * than a slice of it anyway.
 */
export default function capTextContent({ text }: Params) {
    const max = AppData.BotAttachmentTextStoreMaxChars;

    if (text.length <= max) return text;

    const note = `\n\n[Truncated: this document is ${text.length} characters long, so only its beginning was kept. Read the file itself for the rest.]`;
    /**
     * The note counts against the ceiling too: the column is capped, not
     * the text plus whatever was appended to it.
     */
    const kept = Math.max(0, max - note.length);

    return `${text.slice(0, kept)}${note}`;
}
