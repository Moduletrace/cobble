import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import botStoneProps from "@/src/utils/bot-stone-props";
import relativeTime from "@/src/utils/relative-time";
import UnreadDot from "./unread-dot";

type Props = {
    bot: BotWithLastMessage;
    href: string;
};

/**
 * One bot in the all-bots modal: stone, name, job, last activity.
 */
export default function AllBotsRow({ bot, href }: Props) {
    const stone_props = botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue });
    const at = bot.last_message_at || bot.last_activity_at;

    return (
        <Link
            href={href}
            title={bot.name}
            className="flex h-14 items-center gap-3 rounded-default px-3 border-0 leading-normal hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <BotAvatar image_media_id={bot.image_media_id} {...stone_props} face={(bot.face || "idle") as BotFace} />
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{bot.name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {bot.status_line || bot.role || ""}
                </Span>
            </Stack>
            {at ? (
                <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                    {relativeTime({ at: Number(at) })}
                </Span>
            ) : null}
            {bot.unread && stone_props.color ? <UnreadDot color={stone_props.color} /> : null}
        </Link>
    );
}
