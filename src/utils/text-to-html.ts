/**
 * # Convert a stored text field to an HTML fragment for rendering.
 * Documents that switched from plain text to rich HTML (e.g. invoice/quote
 * notes) may still hold legacy plain-text rows — those get their line breaks
 * converted to `<br />` so they render like they used to.
 */
export default function textToSafeHtml(text?: string): string {
    const value = text || "";

    if (/<[a-z][^>]*>/i.test(value)) {
        return value;
    }

    return value.replace(/\r?\n/g, "<br />");
}