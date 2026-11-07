/**
 * Marks an element a quote reads as one inline label: a ref chip
 * (`MarkdownLink`). Chips are inline-flex buttons and links with block
 * wrappers inside, so the selection's own text put a line break before and
 * after each one, and a quoted sentence came out one paragraph per chip.
 */
export const QuoteInlineAttribute = "data-quote-inline";

type Params = {
    range: Range;
};

/**
 * The text of a selection in a message as it reads on screen, for a
 * quote: paragraphs, list items and code keep their line breaks, and each
 * chip is its label, inline. Laid out once in a hidden holder (line breaks
 * come from layout), only when the quote is made, never per selection
 * change. Falls back to the selection's own text.
 */
export default function quotableText({ range }: Params) {
    const fallback = range.toString().trim();

    try {
        const fragment = range.cloneContents();

        for (const chip of Array.from(fragment.querySelectorAll(`[${QuoteInlineAttribute}]`))) {
            chip.replaceWith(document.createTextNode((chip.textContent || "").replace(/\s+/g, " ").trim()));
        }

        const holder = document.createElement("div");

        holder.setAttribute("aria-hidden", "true");
        holder.className = "sr-only";
        holder.append(fragment);
        document.body.append(holder);

        const text = holder.innerText.replace(/\n{3,}/g, "\n\n").trim();

        holder.remove();

        return text || fallback;
    } catch {
        return fallback;
    }
}
