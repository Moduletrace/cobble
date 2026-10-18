import type { BotFace, BotKind } from "@/src/dict/bot-dict";

type CrewBot = {
    kind?: BotKind | string | null;
    face?: BotFace | string | null;
};

type Params = {
    bots: CrewBot[];
};

const NUMBER_WORDS = [
    "No",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
] as const;

function countWord({ n }: { n: number }): string {
    return NUMBER_WORDS[n] ?? String(n);
}

/**
 * Working and needs-you counts across the workers (the coordinator excluded).
 */
export function crewCounts({ bots }: Params) {
    const workers = bots.filter((bot) => bot.kind !== "coordinator");

    return {
        working: workers.filter((bot) => bot.face === "working").length,
        needs_you: workers.filter((bot) => bot.face === "needs-you").length,
    };
}

/**
 * The coordinator's rail subtitle: `3 working · 1 needs you`.
 */
export function crewStatusLine({ bots }: Params): string {
    const { working, needs_you } = crewCounts({ bots });
    const parts: string[] = [];

    if (working) parts.push(`${working} working`);
    if (needs_you) parts.push(`${needs_you} need${needs_you == 1 ? "s" : ""} you`);

    return parts.length ? parts.join(" · ") : "All quiet";
}

/**
 * The signature status sentence: `Three bots are working. One needs you.`
 */
export function crewStatusSentence({ bots }: Params): string {
    const { working, needs_you } = crewCounts({ bots });
    const sentences: string[] = [];

    if (working) {
        sentences.push(
            working == 1
                ? `One bot is working.`
                : `${countWord({ n: working })} bots are working.`,
        );
    }

    if (needs_you) {
        const subject = working
            ? countWord({ n: needs_you })
            : `${countWord({ n: needs_you })} bot${needs_you == 1 ? "" : "s"}`;
        sentences.push(`${subject} need${needs_you == 1 ? "s" : ""} you.`);
    }

    return sentences.length ? sentences.join(" ") : "Nothing needs you.";
}
