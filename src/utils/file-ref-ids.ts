/**
 * The ids of every `[file:ID]` ref in a text, once each, in order. Refs
 * already written as links (`[file:3](...)`) count too: they still name
 * the file.
 */
export default function fileRefIds({ text }: { text: string }) {
    const ids: number[] = [];

    for (const match of text.matchAll(/\[file:(\d+)\]/g)) {
        const id = Number(match[1]);

        if (id > 0 && !ids.includes(id)) ids.push(id);
    }

    return ids;
}
