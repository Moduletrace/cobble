type Params = {
    /**
     * The document's whole text.
     */
    text: string;
    /**
     * One of its passages, which may start with a heading carried over and
     * a stretch repeated from the passage before.
     */
    passage: string;
};

/**
 * Where a passage sits in its document, roughly: found by its last line
 * (the part least likely to be a carried heading or an overlap), counted
 * back by where that line sits in the passage. 0 when it can't be found.
 */
export default function locatePassage({ text, passage }: Params) {
    const lines = passage.split("\n").map((line) => line.trim()).filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]!;
        const at = text.indexOf(line);

        if (at < 0) continue;

        return Math.max(0, at - passage.lastIndexOf(line));
    }

    return 0;
}
