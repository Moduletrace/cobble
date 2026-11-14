type Params = {
    text: string;
    max: number;
};

/**
 * Cuts text to at most `max` characters, breaking on a word where it can so
 * the cut reads as a cut and not a typo.
 */
export function truncateText({ text, max }: Params) {
    if (text.length <= max) return text;

    const cut = text.slice(0, max);
    const last_space = cut.lastIndexOf(" ");

    return `${(last_space > max * 0.6 ? cut.slice(0, last_space) : cut).trimEnd()}...`;
}
