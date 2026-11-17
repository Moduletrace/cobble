import { liveRefParts } from "./link-computer-refs";

/**
 * The ids of the `[file:ID]` refs a message actually renders as chips,
 * once each, in order: the renderer's own rules (`liveRefParts`), so a ref
 * quoted alone in a code span counts and one inside longer code (a span
 * with other text, a fenced block) does not. Refs already written as links
 * (`[file:3](...)`) count too: they still name the file.
 */
export default function liveFileRefIds({ text }: { text: string }): number[] {
    const ids: number[] = [];

    for (const part of liveRefParts({ text })) {
        for (const match of part.matchAll(/\[file:(\d+)\]/g)) {
            const id = Number(match[1]);

            if (id > 0 && !ids.includes(id)) ids.push(id);
        }
    }

    return ids;
}
