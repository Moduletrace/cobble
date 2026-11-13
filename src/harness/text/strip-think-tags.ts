type Params = {
    text: string;
};

/**
 * Splits a model's answer from the ` thinking...` reasoning some
 * models write into it, including an unclosed one at the start. The answer
 * is what the bot says; the reasoning goes only to the debug view.
 */
export default function stripThinkTags({ text }: Params): { text: string; reasoning: string | null } {
    const thoughts: string[] = [];

    let answer = text.replace(/<think[^>]*>([\s\S]*?)<\/think>/gi, (_block: string, reason: string) => {
        thoughts.push(reason);
        return "";
    });

    const unclosed = /^\s*<think[^>]*>([\s\S]*)$/i.exec(answer);

    if (unclosed) {
        thoughts.push(unclosed[1] || "");
        answer = answer.slice(0, unclosed.index);
    }

    const reasoning = thoughts
        .map((thought) => thought.trim())
        .filter(Boolean)
        .join("\n\n")
        .trim();

    return { text: answer.trim(), reasoning: reasoning || null };
}