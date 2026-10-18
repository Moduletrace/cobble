import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { BotHue } from "@/src/dict/bot-dict";
import { BotHueBgClasses } from "@/src/dict/bot-hue-classes-dict";

/**
 * 6px unread dot in the bot's own hue. Redundant by design (the snippet and
 * time carry the same information), which is why it may fail 3:1 on some
 * hues. Never remove the snippet or time.
 */
export default function UnreadDot({ hue }: { hue: BotHue }) {
    return (
        <Span
            className={twMerge("size-1.5 rounded-full mr-1", BotHueBgClasses[hue])}
            aria-label="Unread"
            role="img"
        />
    );
}
