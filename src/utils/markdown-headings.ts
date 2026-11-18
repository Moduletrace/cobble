type Params = {
    text?: string | null;
};

/**
 * The headings a markdown text has, in order and without their `#` marks:
 * the sections a reader scans for. Lines inside a fenced code block are
 * code, not headings, and neither is a `#!` line (a shell comment starts
 * like a heading).
 */
export default function markdownHeadings({ text }: Params): string[] {
    const headings: string[] = [];
    /**
     * The character a fence opened with, while inside one.
     */
    let fence: string | null = null;

    for (const raw of (text || "").split("\n")) {
        const line = raw.trim();
        const opening = line.match(/^(`{3,}|~{3,})/);

        if (opening?.[1]) {
            const marker = opening[1].charAt(0);

            if (fence == null) fence = marker;
            else if (fence == marker) fence = null;

            continue;
        }

        if (fence || line.startsWith("#!")) continue;

        const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);

        if (heading?.[1]) headings.push(heading[1]);
    }

    return headings;
}