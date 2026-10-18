import sanitizeHtml from "sanitize-html";

/**
 * Tags allowed in admin-authored rich text (TinyMCE output).
 */
const AllowedTags = [
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "sub",
    "sup",
    "span",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
];

const AllowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class"],
};

type Params = {
    html?: string | null;
};

/**
 * # Sanitize rich text HTML.
 * Strips scripts, event handlers, embedded frames and unsafe URL schemes
 * while preserving the formatting TinyMCE produces. Use it on every write
 * to an `html: true` column that accepts user input.
 */
export default function sanitizeRichTextHtml({ html }: Params): string {
    if (!html) {
        return "";
    }

    return sanitizeHtml(html, {
        allowedTags: AllowedTags,
        allowedAttributes: AllowedAttributes,
        allowedSchemes: ["http", "https", "mailto"],
        // TinyMCE can embed pasted images as data URLs.
        allowedSchemesByTag: {
            img: ["http", "https", "data"],
        },
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                rel: "noopener noreferrer",
            }),
        },
    });
}
