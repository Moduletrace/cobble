import { AppData } from "@/src/data/app-data";
import markdownHeadings from "./markdown-headings";

type Params = {
    /**
     * What's stored now.
     */
    before?: string | null;
    /**
     * What the caller wants stored instead.
     */
    after: string;
    /**
     * The caller means to drop what's there now, so nothing is refused.
     */
    replace?: boolean;
};

const ListedHeadings = 6;

/**
 * Why replacing a shared text whole would throw away what it held, or null
 * when it wouldn't. Every save of this kind replaces the text in full, so a
 * bot that retypes it from what it remembers of its prompt writes a shorter
 * one and reports the job done: this is the one refusal that stops the
 * loss, and `replace: true` is how a caller says it meant it.
 *
 * It reads headings as sections, ignoring fenced code, and treats a big cut
 * in length as a loss even when every heading survived.
 */
export default function sharedTextProblem({ before, after, replace }: Params): string | null {
    const current = (before || "").trim();
    const next = (after || "").trim();

    if (replace || !current || current == next) return null;

    const kept = markdownHeadings({ text: next });
    const lost = markdownHeadings({ text: current }).filter((heading) => !kept.includes(heading));

    const shrank =
        current.length >= AppData.SharedTextGuardMinChars &&
        next.length < current.length * AppData.SharedTextShrinkShare;

    if (!lost.length && !shrank) return null;

    const listed = lost
        .slice(0, ListedHeadings)
        .map((heading) => `"${heading}"`)
        .join(", ");
    const more = lost.length > ListedHeadings ? ` and ${lost.length - ListedHeadings} more` : "";

    const loss = lost.length
        ? `drop ${lost.length == 1 ? "the section" : `${lost.length} sections`} ${listed}${more}`
        : "cut the text down";

    return `Refused: this replaces the whole text, and what you sent would ${loss} (${current.length} -> ${next.length} characters). Send the whole text again with every section that still applies kept, or pass replace: true if dropping them is what you mean.`;
}