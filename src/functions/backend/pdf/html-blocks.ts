export type TextSegment = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
};

export type TextBlock =
    | { type: "paragraph"; segments: TextSegment[] }
    | { type: "heading"; level: number; segments: TextSegment[] }
    | { type: "list-item"; ordered: boolean; index: number; segments: TextSegment[] }
    | { type: "blockquote"; segments: TextSegment[] }
    | { type: "divider" };

const named_entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ensp: " ",
    emsp: " ",
    ndash: "\u2013",
    mdash: "\u2014",
    hellip: "\u2026",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201c",
    rdquo: "\u201d",
    bull: "\u2022",
    middot: "\u00b7",
    times: "\u00d7",
    copy: "\u00a9",
    reg: "\u00ae",
    trade: "\u2122",
    deg: "\u00b0",
    sect: "\u00a7",
    para: "\u00b6",
    euro: "\u20ac",
    pound: "\u00a3",
    minus: "\u2212",
    radic: "\u221a",
    frac12: "\u00bd",
    frac14: "\u00bc",
    frac34: "\u00be",
};

function decodeEntities(text: string): string {
    return text
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
            String.fromCodePoint(parseInt(hex, 16)),
        )
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(
            /&([a-zA-Z]+);/g,
            (match, name: string) => named_entities[name.toLowerCase()] || match,
        );
}

const INLINE_STYLE_OPEN = ["b", "strong", "i", "em", "u", "ins"];
const INLINE_STYLE_CLOSE = ["b", "strong", "i", "em", "u", "ins"];
const HEADING_LEVELS: Record<string, number> = {
    h1: 1,
    h2: 2,
    h3: 3,
    h4: 4,
    h5: 5,
    h6: 6,
};

/**
 * # Convert an HTML fragment (TinyMCE output) into simple text blocks
 * suitable for rendering in a PDF. Supports: p, div, br, h1-h6, ul/ol/li,
 * blockquote, hr, b/strong, i/em, u/ins, a, span, img (alt text) and
 * basic table cells (degraded to inline text separated by spaces).
 */
export default function htmlToTextBlocks(html?: string): TextBlock[] {
    const source = html || "";
    const blocks: TextBlock[] = [];

    let pending_text = "";
    const style = { bold: false, italic: false, underline: false };
    let current: TextBlock | undefined;
    const list_stack: { ordered: boolean; index: number }[] = [];

    const appendText = (raw: string) => {
        if (!raw) return;
        const decoded = decodeEntities(raw);
        if (!decoded) return;
        pending_text += decoded;
    };

    const flushText = () => {
        if (!pending_text) return;
        if (!current) {
            current = { type: "paragraph", segments: [] };
        } else if (current.type == "divider") {
            current = { type: "paragraph", segments: [] };
        }
        current.segments.push({
            text: pending_text,
            ...(style.bold ? { bold: true } : {}),
            ...(style.italic ? { italic: true } : {}),
            ...(style.underline ? { underline: true } : {}),
        });
        pending_text = "";
    };

    const flushBlock = () => {
        flushText();
        if (current) {
            blocks.push(current);
            current = undefined;
        }
    };

    const startBlock = (block: TextBlock) => {
        flushBlock();
        current = block;
    };

    const pattern = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g;
    let last = 0;
    let match;

    while ((match = pattern.exec(source)) !== null) {
        appendText(source.slice(last, match.index));
        last = match.index + (match[0] || "").length;

        const closing = Boolean(match[1]);
        const tag = (match[2] || "").toLowerCase();
        const attrs = match[3] || "";

        if (INLINE_STYLE_OPEN.includes(tag) && !closing) {
            if (["b", "strong"].includes(tag)) {
                flushText();
                style.bold = true;
            }
            if (["i", "em"].includes(tag)) {
                flushText();
                style.italic = true;
            }
            if (["u", "ins"].includes(tag)) {
                flushText();
                style.underline = true;
            }
            continue;
        }

        if (INLINE_STYLE_CLOSE.includes(tag) && closing) {
            if (["b", "strong"].includes(tag)) {
                flushText();
                style.bold = false;
            }
            if (["i", "em"].includes(tag)) {
                flushText();
                style.italic = false;
            }
            if (["u", "ins"].includes(tag)) {
                flushText();
                style.underline = false;
            }
            continue;
        }

        if (["p", "div"].includes(tag)) {
            if (closing) {
                flushBlock();
            } else {
                startBlock({ type: "paragraph", segments: [] });
            }
            continue;
        }

        if (HEADING_LEVELS[tag]) {
            if (closing) {
                flushBlock();
            } else {
                startBlock({
                    type: "heading",
                    level: HEADING_LEVELS[tag],
                    segments: [],
                });
            }
            continue;
        }

        if (tag == "br") {
            flushBlock();
            continue;
        }

        if (tag == "hr") {
            flushBlock();
            blocks.push({ type: "divider" });
            continue;
        }

        if (["ul", "ol"].includes(tag)) {
            if (closing) {
                flushBlock();
                list_stack.pop();
            } else {
                flushBlock();
                list_stack.push({ ordered: tag == "ol", index: 0 });
            }
            continue;
        }

        if (tag == "li") {
            if (closing) {
                flushBlock();
            } else {
                const list = list_stack[list_stack.length - 1] || {
                    ordered: false,
                    index: 0,
                };
                startBlock({
                    type: "list-item",
                    ordered: list.ordered,
                    index: list.index,
                    segments: [],
                });
                list.index += 1;
            }
            continue;
        }

        if (tag == "blockquote") {
            if (closing) {
                flushBlock();
            } else {
                startBlock({ type: "blockquote", segments: [] });
            }
            continue;
        }

        if (tag == "img" && !closing) {
            const alt = attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
            if (alt?.[1]) appendText(` ${alt[1]} `);
            continue;
        }

        if (["td", "th", "p", "div", "li"].includes(tag) && !closing) {
            appendText(" ");
            continue;
        }

        if (["table", "thead", "tbody", "tr"].includes(tag)) {
            if (!closing && ["tr"].includes(tag)) {
                // no-op, cells add their own spacing
            }
            continue;
        }
    }

    appendText(source.slice(last));
    flushBlock();

    return blocks;
}