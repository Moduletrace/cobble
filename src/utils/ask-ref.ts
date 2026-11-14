/**
 * How a message names a crew request: `[ask:<id>]`. The chat turns it into
 * a link (`linkComputerRefs`) that renders as a pill pointing at the
 * conversation the request ran in.
 */
export default function askRef({ id }: { id: number | string }) {
    return `[ask:${id}]`;
}

/**
 * The link target an ask ref becomes, e.g. `#ask-20`.
 */
export const AskRefHrefPrefix = "#ask-";

/**
 * The id in an ask ref's link target, or null.
 */
export function askRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(AskRefHrefPrefix)) return null;

    const id = Number(href.slice(AskRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}
