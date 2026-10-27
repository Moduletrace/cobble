type Params = {
    id: number | string;
};

/**
 * How a bot names a graphic it made: `[graphic:5]`. The chat turns it
 * into a link (`linkComputerRefs`) that renders as the graphic itself,
 * framed in the thread, with ways to open it full size.
 */
export default function graphicRef({ id }: Params) {
    return `[graphic:${id}]`;
}

/**
 * The link target a graphic ref becomes, e.g. `#graphic-5`.
 */
export const GraphicRefHrefPrefix = "#graphic-";

/**
 * The id in a graphic ref's link target, or null.
 */
export function graphicRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(GraphicRefHrefPrefix)) return null;

    const id = Number(href.slice(GraphicRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}
