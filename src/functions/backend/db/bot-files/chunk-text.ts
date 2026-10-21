import { AppData } from "@/src/data/app-data";

type Params = {
    text: string;
    /**
     * How much text one chunk holds, in characters.
     */
    target?: number;
    /**
     * How much of the previous chunk the next one repeats, so a sentence
     * cut in two is still whole somewhere.
     */
    overlap?: number;
};

/**
 * Splits a document's text into chunks for embedding: paragraphs packed up
 * to the target size, a heading carried into the chunk that follows it,
 * and long paragraphs cut at word boundaries with an overlap. Never cuts
 * mid-word (a word longer than the target is the one exception, since
 * there's nowhere else to cut).
 */
export default function chunkText({
    text,
    target = AppData.ChunkTargetChars,
    overlap = AppData.ChunkOverlapChars,
}: Params): string[] {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (!normalized) return [];

    const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    const chunks: string[] = [];
    /**
     * The current chunk's blocks, then (after a flush) only the overlap
     * carried over: `fresh` says whether anything new joined it, so a
     * carry on its own is never pushed as a chunk.
     */
    let current: string[] = [];
    let current_length = 0;
    let fresh = false;
    let heading = "";

    const flush = () => {
        const body = current.join("\n\n").trim();

        if (body && fresh) {
            chunks.push(heading && !body.startsWith(heading) ? `${heading}\n\n${body}` : body);
        }

        const carry = overlap > 0 ? tail({ text: body, size: overlap }) : "";

        current = carry ? [carry] : [];
        current_length = carry.length;
        fresh = false;
    };

    for (const block of blocks) {
        const is_heading = /^#{1,6}\s/.test(block);

        if (is_heading) {
            /**
             * A heading starts a new chunk with it, so a chunk says what it
             * is about.
             */
            if (current_length > 0) flush();

            heading = block;
            continue;
        }

        if (block.length >= target) {
            if (current_length > 0) flush();

            for (const piece of splitLongBlock({ block, target, overlap })) {
                chunks.push(heading ? `${heading}\n\n${piece}` : piece);
            }

            current = [];
            current_length = 0;
            fresh = false;
            continue;
        }

        if (current_length + block.length + 2 > target) flush();

        current.push(block);
        current_length += block.length + 2;
        fresh = true;
    }

    if (current_length > 0) flush();

    return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Cuts a block that is longer than one chunk at word boundaries, keeping
 * the overlap between pieces.
 */
function splitLongBlock({
    block,
    target,
    overlap,
}: {
    block: string;
    target: number;
    overlap: number;
}) {
    const words = block.split(/\s+/);
    const pieces: string[] = [];
    let current: string[] = [];
    let length = 0;

    for (const word of words) {
        if (length + word.length + 1 > target && current.length) {
            pieces.push(current.join(" "));
            const carry = tail({ text: current.join(" "), size: overlap });

            current = carry ? carry.split(" ") : [];
            length = carry.length;
        }

        if (!word) continue;

        current.push(word);
        length += word.length + 1;
    }

    if (current.length) pieces.push(current.join(" "));

    return pieces;
}

/**
 * The last `size` characters of a text, starting at a word boundary so the
 * overlap doesn't begin mid-word.
 */
function tail({ text, size }: { text: string; size: number }) {
    if (!text || size <= 0) return "";

    if (text.length <= size) return text;

    const cut = text.slice(text.length - size);
    const boundary = cut.search(/\s/);

    return boundary == -1 ? cut : cut.slice(boundary).trim();
}
