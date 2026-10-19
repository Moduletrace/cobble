type Params = {
    text: string;
};

/**
 * Removes the `<think>...</think>` reasoning some models write into their
 * answer, including an unclosed one at the start.
 */
export default function stripThinkTags({ text }: Params) {
    return text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/^\s*<think>[\s\S]*$/i, "")
        .trim();
}
