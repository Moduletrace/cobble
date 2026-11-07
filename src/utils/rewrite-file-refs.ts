/**
 * A text with its `[file:ID]` refs pointed at other files: each id in
 * `ids` becomes the one it maps to, everything else stays as written.
 */
export default function rewriteFileRefs({ text, ids }: { text: string; ids: Map<number, number> }) {
    if (!ids.size) return text;

    return text.replace(/\[file:(\d+)\]/g, (ref, id: string) => {
        const to = ids.get(Number(id));

        return to ? `[file:${to}]` : ref;
    });
}
