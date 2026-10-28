type Params = {
    id: number | string;
};

/**
 * How a bot names questions it asked the user: `[question:4]`. The chat
 * turns it into a link (`linkComputerRefs`) that renders as a chip opening
 * the card the user answers them in.
 */
export default function botQuestionRef({ id }: Params) {
    return `[question:${id}]`;
}

/**
 * The link target a question ref becomes, e.g. `#question-4`.
 */
export const BotQuestionRefHrefPrefix = "#question-";

/**
 * The id in a question ref's link target, or null.
 */
export function botQuestionRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(BotQuestionRefHrefPrefix)) return null;

    const id = Number(href.slice(BotQuestionRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}
