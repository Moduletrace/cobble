import { BotHues, type BotHue } from "@/src/dict/bot-dict";

type Params = {
    /**
     * Hues the crew already has.
     */
    taken: (string | null | undefined)[];
};

/**
 * The first hue nobody on the crew has yet, else the least used one, so a
 * new bot is told apart at a glance.
 */
export default function pickFreeHue({ taken }: Params): BotHue {
    const counts = new Map<string, number>(BotHues.map((hue) => [hue.value, 0]));

    for (const hue of taken) {
        if (hue && counts.has(hue)) counts.set(hue, counts.get(hue)! + 1);
    }

    return [...BotHues].sort((a, b) => counts.get(a.value)! - counts.get(b.value)!)[0]!.value;
}
