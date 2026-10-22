import { BotHues, type BotStoneShape } from "@/src/dict/bot-dict";

type Params = {
    /**
     * The colours already in use, so the new bot differs from the crew.
     */
    taken: (string | null | undefined)[];
};

/**
 * The colour a new bot starts with: the first palette colour nobody on the
 * crew has yet, else the least used one. It comes with that palette entry's
 * stone, so a new bot looks like every bot did before colours were free.
 * The user can then pick any colour they like.
 */
export default function pickFreeColor({ taken }: Params): {
    color: string;
    stone: BotStoneShape;
} {
    const counts = new Map<string, number>(BotHues.map((entry) => [entry.color, 0]));

    for (const color of taken) {
        const key = (color || "").toLowerCase();

        if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
    }

    const picked = [...BotHues].sort(
        (a, b) => counts.get(a.color)! - counts.get(b.color)!,
    )[0]!;

    return { color: picked.color, stone: picked.value };
}
