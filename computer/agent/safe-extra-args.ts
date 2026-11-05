type Params = {
    /**
     * Space separated flags, as set (no quoting).
     */
    text?: string;
    blocked: readonly string[];
};

/**
 * Extra flags from the computer's settings, without the blocked ones,
 * whatever case they're in: `--name=value`, or `--name` and the value
 * after it (a word not starting with `-`).
 */
export default function safeExtraArgs({ text, blocked }: Params) {
    const words = String(text || "")
        .split(/\s+/)
        .filter(Boolean);
    const kept: string[] = [];

    for (let index = 0; index < words.length; index++) {
        const word = words[index]!;
        const [name, value] = [word.split("=")[0]!.toLowerCase(), word.includes("=")];

        if (!blocked.includes(name)) {
            kept.push(word);
            continue;
        }

        if (!value && words[index + 1] && !words[index + 1]!.startsWith("-")) index++;
    }

    return kept;
}
