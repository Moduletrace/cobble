type Params = {
    /**
     * What the tool says the user asked for, in the user's own words.
     */
    quote: string;
    /**
     * Everything the user wrote in the conversation, oldest first.
     */
    texts: string[];
};

/**
 * Whether a quote a crew-changing tool was given is a span of one human
 * message. A quote under 24 normalised characters never counts: an 8
 * character overlap sits inside too many ordinary sentences.
 *
 * Markdown the user typed and the model retyped is normalised away (`**`,
 * `_`, backticks, quotes), whitespace collapsed and case ignored, so a quote
 * of the user's sentence still matches a copied one.
 */
export const UserAskedQuoteMinChars = 24;

export default function userAskedQuote({ quote, texts }: Params): boolean {
    const sought = normalise({ text: quote });

    if (sought.length < UserAskedQuoteMinChars) return false;

    return texts.some((text) => normalise({ text }).includes(sought));
}

/**
 * The text as one run of words: markdown emphasis and code markers out,
 * curly quotes and dashes flattened, whitespace collapsed, lower case.
 */
export function normalise({ text }: { text: string }): string {
    return text
        .replace(/[`*_~]+/g, "")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, `"`)
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
