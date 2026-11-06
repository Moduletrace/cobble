type Params = {
    text: string;
    /**
     * The ref's kind, as in `[file:12]` or `[task:20]`.
     */
    kind: "file" | "task";
};

/**
 * The ids of every `[<kind>:ID]` ref in a message, once each, in order:
 * what a reply names, for checking each exists before it goes out.
 */
export default function replyRefIds({ text, kind }: Params): number[] {
    const pattern = new RegExp(`\\[${kind}:\\s*(\\d+)\\s*\\]`, "gi");
    const ids: number[] = [];

    for (const match of text.matchAll(pattern)) {
        const id = Number(match[1]);

        if (Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
    }

    return ids;
}
