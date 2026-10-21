/**
 * How a bot names one of its files in a message: `[file:12]`. The chat
 * turns it into a link to the file (`linkComputerRefs`), which a chip
 * renders with the file's name.
 */
export default function fileRef({ id }: { id: number | string }) {
    return `[file:${id}]`;
}

/**
 * The link target a file ref becomes, e.g. `#file-12`.
 */
export const FileRefHrefPrefix = "#file-";

/**
 * The id in a file ref's link target, or null.
 */
export function fileRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(FileRefHrefPrefix)) return null;

    const id = Number(href.slice(FileRefHrefPrefix.length));

    return Number.isFinite(id) && id > 0 ? id : null;
}
