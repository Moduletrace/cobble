type Params = {
    query: string;
};

export type KnowledgebaseWordQuery = {
    /**
     * An FTS5 `MATCH` expression: every word, any of them matching, the
     * longer ones as prefixes ("refund" finds "refunds"). Null when the
     * query has no word the index can match.
     */
    match: string | null;
    /**
     * Substrings for the fallback `LIKE` search, for when the index finds
     * nothing: the words, and two-character pieces of text written without
     * spaces (Chinese, Japanese, Thai), which the index keeps as one long
     * token and so can't match by a word inside it.
     */
    like_terms: string[];
};

const MaxWords = 8;
const MaxLikeTerms = 12;

/**
 * Scripts written without spaces between words.
 */
const Unspaced = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

/**
 * Turns a question into what the knowledgebase word search runs: letters
 * and numbers in any script, lowercased, words of one character dropped.
 */
export default function knowledgebaseWordQuery({ query }: Params): KnowledgebaseWordQuery {
    const runs = query.normalize("NFKC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];

    const words: string[] = [];
    const pieces: string[] = [];

    for (const run of runs) {
        if (Unspaced.test(run)) {
            const chars = Array.from(run);

            if (chars.length == 1) pieces.push(run);

            for (let i = 0; i + 1 < chars.length; i++) pieces.push(`${chars[i]}${chars[i + 1]}`);

            continue;
        }

        if (Array.from(run).length > 1) words.push(run);
    }

    const unique_words = [...new Set(words)].slice(0, MaxWords);

    return {
        match: unique_words.length
            ? unique_words.map((word) => (Array.from(word).length >= 4 ? `"${word}"*` : `"${word}"`)).join(" OR ")
            : null,
        like_terms: [...new Set([...unique_words.filter((word) => Array.from(word).length >= 3), ...pieces])].slice(
            0,
            MaxLikeTerms,
        ),
    };
}
