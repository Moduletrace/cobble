type Params = {
    text: string;
};

/**
 * The mention is the subject of a clause that says that task is gone.
 * A gone-word elsewhere in the sentence does not count.
 */
function mentionIsGone({ sentence, mention }: { sentence: string; mention: string }): boolean {
    const escaped = mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const gone =
        `(?:was |is |has been |have been )?(?:deleted|removed|cancell?ed|gone|no longer (?:there|exists?)|doesn'?t exist(?: any more)?|didn'?t exist|doesn'?t appear|isn'?t there|not in (?:the |your )?list|isn'?t (?:in|on) (?:the |your )?list)`;
    const governed = new RegExp(
        `(?:^|[.!?;]\\s*|\\b(?:and|but|so)\\s+)(?:there(?:'s| is) no |no such )?(?:I |we )?(?:deleted|removed|cancell?ed) ${escaped}\\b` +
            `|(?:^|[.!?;]\\s*|\\b(?:and|but|so)\\s+)(?:there(?:'s| is) no |no such )?${escaped}\\s+${gone}\\b` +
            `|\\b(?:can'?t find|couldn'?t find|there(?:'s| is) no|no such)(?:\\s+\\w+){0,3}\\s+${escaped}\\b`,
        "i",
    );

    return governed.test(sentence);
}

/**
 * The task ids a reply names in plain prose (`task #16`), as opposed to
 * `[task:16]` refs. A mention that is the subject of "was deleted" (and
 * the same) is left out.
 */
export default function mentionedTaskIds({ text }: Params): number[] {
    const ids = new Set<number>();

    for (const match of text.matchAll(/\btasks?\s*#\s*(\d+)/gi)) {
        const id = Number(match[1]);
        const index = match.index ?? 0;

        if (!id || mentionIsGone({ sentence: sentenceAround({ text, index, length: match[0].length }), mention: match[0] })) {
            continue;
        }

        ids.add(id);
    }

    return [...ids];
}

/**
 * The sentence a mention sits in, so a word about deleting the task
 * elsewhere in the reply doesn't excuse it.
 */
function sentenceAround({ text, index, length }: { text: string; index: number; length: number }): string {
    let start = index;

    while (start > 0 && !/[.!?\n]/.test(text[start - 1]!)) start--;

    let end = index + length;

    while (end < text.length && !/[.!?\n]/.test(text[end]!)) end++;

    return text.slice(start, end + 1);
}
