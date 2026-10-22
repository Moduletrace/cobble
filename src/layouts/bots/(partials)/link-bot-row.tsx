import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
    linking?: boolean;
    disabled?: boolean;
    onLink: () => void;
};

/**
 * One bot in the link-bots modal: stone, name, job, and Add.
 */
export default function LinkBotRow({ bot, linking, disabled, onLink }: Props) {
    return (
        <Row className="h-14 items-center gap-3 rounded-default px-3 flex-nowrap hover:bg-sunken transition-colors duration-[var(--m-fast)]">
            <BotAvatar
                image_media_id={bot.image_media_id}
                {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                face={(bot.face || "idle") as BotFace}
            />
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{bot.name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">{bot.role || ""}</Span>
            </Stack>
            <Button
                title={`Add ${bot.name || "this bot"}`}
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                loading={linking}
                disabled={disabled}
                onClick={onLink}
                className="shrink-0"
            >
                Add
            </Button>
        </Row>
    );
}
