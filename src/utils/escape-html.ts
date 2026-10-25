type Params = {
    text: string;
};

/**
 * Text made safe to drop into HTML, in an element or a quoted attribute.
 */
export default function escapeHtml({ text }: Params) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
