import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";
import BotStone from "@/src/components/general/bot-stone";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import { crewStatusSentence } from "@/src/utils/crew-status";
import BotModelsModal from "./bot-models-modal";

type Props = {
    bot: BotWithLastMessage;
    bots: BotWithLastMessage[];
    /**
     * The bot's models (the defaults for the coordinator).
     */
    harnesses?: HarnessOverview[] | null;
};

/**
 * 64px header. The coordinator's status is the crew sentence. On the
 * right, the model button that opens the bot's models (the defaults on
 * the coordinator, for super admins).
 */
export default function ConversationHeader({ bot, bots, harnesses }: Props) {
    const status =
        bot.kind === "coordinator"
            ? crewStatusSentence({ bots })
            : bot.status_line || "";

    return (
        <Row className="h-16 shrink-0 gap-3! flex-nowrap items-center px-6 border-0 border-b border-solid border-hairline">
            <BotStone
                hue={(bot.hue || null) as BotHue | null}
                face={(bot.face || "idle") as BotFace}
                size={40}
            />
            <Stack className="min-w-0 gap-0!">
                <H1 className="text-lg! leading-6! tracking-normal! font-bold text-ink truncate">
                    {bot.name}
                </H1>
                <Span className="text-[13px] leading-[18px] text-ink-secondary truncate">
                    {status}
                </Span>
            </Stack>
            <BotModelsModal key={bot.id} bot={bot} harnesses={harnesses} />
        </Row>
    );
}
