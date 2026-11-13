type Params = {
    id: number | string;
};

/**
 * How a bot names next steps it suggested: `[suggestion:4]`. The chat
 * turns it into a link (`linkComputerRefs`) that renders as a row of
 * buttons putting each step in the user's input.
 */
export default function botSuggestionRef({ id }: Params) {
    return `[suggestion:${id}]`;
}

/**
 * The link target a suggestion ref becomes, e.g. `#suggestion-4`.
 */
export const BotSuggestionRefHrefPrefix = "#suggestion-";

/**
 * The id in a suggestion ref's link target, or null.
 */
export function botSuggestionRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(BotSuggestionRefHrefPrefix)) return null;

    const id = Number(href.slice(BotSuggestionRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}