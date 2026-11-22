type Params = {
    id: number | string;
};

/**
 * How the app names a connect request under a message: `[connect:7]`. The
 * chat shows it as the card that opens the provider's sign-in, so the link
 * itself never goes through the chat or the model.
 */
export default function connectRef({ id }: Params) {
    return `[connect:${id}]`;
}

/**
 * The id inside a connect ref, or 0 when it isn't one.
 */
export function connectRefId({ href }: { href?: string }) {
    return Number(/\[connect:(\d+)\]/.exec(href || "")?.[1] || 0);
}

/**
 * The link target a connect ref becomes, e.g. `#connect-7`.
 */
export const ConnectRefHrefPrefix = "#connect-";

/**
 * The request id inside a rendered connect link's target, or 0.
 */
export function connectRequestIdFromHref({ href }: { href?: string }) {
    if (!href?.startsWith(ConnectRefHrefPrefix)) return 0;

    return Number(href.slice(ConnectRefHrefPrefix.length)) || 0;
}