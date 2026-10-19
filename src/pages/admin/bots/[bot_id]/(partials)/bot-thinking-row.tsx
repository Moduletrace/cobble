import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import BotStone from "@/src/components/general/bot-stone";
import type { BotHue } from "@/src/dict/bot-dict";
import { BotReplyJobTitle, BotWaitingStatusLine } from "@/src/dict/bot-queue-dict";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * Under the last message while the bot is working on a reply (or waiting
 * for a model to come back), so a slow reply doesn't look like none.
 */
export default function BotThinkingRow({ bot }: Props) {
    const thinking = bot.face == "working" && bot.status_line == BotReplyJobTitle;
    const waiting = bot.face == "asleep" && bot.status_line == BotWaitingStatusLine;

    if (!thinking && !waiting) return null;

    return (
        <Row role="status" className="w-full gap-3! flex-nowrap items-center">
            <BotStone
                hue={(bot.hue || null) as BotHue | null}
                face={thinking ? "working" : "asleep"}
                size={28}
            />
            <Span className="text-sm leading-5 text-ink-secondary animate-pulse motion-reduce:animate-none">
                {thinking ? `${bot.name || "The bot"} is thinking…` : `${BotWaitingStatusLine}…`}
            </Span>
        </Row>
    );
}
