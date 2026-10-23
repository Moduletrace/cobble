import canExtractText from "./can-extract-text";
import capTextContent from "./cap-text-content";

type Params = {
    /**
     * The file's name, when the row kept it (`media.title`).
     */
    name?: string | null;
    /**
     * Its MIME type (`media.mime_type`). For old rows this is often just
     * the extension.
     */
    mime_type?: string | null;
};

/**
 * What a `media` row's `text_content` should be: the text itself when it
 * belongs there, `null` when the row should not carry any.
 *
 * A row qualifies when its file is one the extractor really unpacks
 * (`canExtractText`); its text is then cut to the store ceiling
 * (`capTextContent`). Anything else - a zip, an SVG, a spreadsheet, a
 * binary that only ever had its bytes decoded - loses its `text_content`,
 * because that column is an extracted-text cache, not a copy of the file.
 */
export default function decideTextContent({
    name,
    mime_type,
    text,
}: Params & { text?: string | null }): string | null {
    if (!text || !text.trim()) return null;

    if (!canExtractText({ name, mime_type })) return null;

    return capTextContent({ text });
}
