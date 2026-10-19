import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotWithLastMessage } from "@/src/types";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import messagePreview from "@/src/utils/message-preview";
import relativeTime from "@/src/utils/relative-time";
import UnreadDot from "./unread-dot";

type Props = {
    bot: BotWithLastMessage;
    /**
     * Where the row goes; the bot's own chat by default.
     */
    href?: string;
    selected?: boolean;
    /**
     * Shown when the bot has no status line, before the last-message
     * snippet (the coordinator's crew counts).
     */
    subtitle?: string;
};

/**
 * 48px rail row. Status is the face and the subtitle (the bot's status
 * line while it has one): no badges, spinners or state dots.
 * The selected background (ink at 5%, never a hue) is painted by
 * RailBotCard, which also holds the sessions.
 */
export default function BotRow({ bot, href, selected, subtitle }: Props) {
    const hue = (bot.hue || null) as BotHue | null;
    const snippet =
        bot.status_line ||
        subtitle ||
        (bot.last_message_text ? messagePreview({ text: bot.last_message_text }) : "") ||
        bot.role ||
        "";
    const at = bot.last_message_at || bot.last_activity_at;

    return (
        <Link
            href={href || `/admin/bots/${bot.id}`}
            aria-current={selected ? "page" : undefined}
            title={bot.name}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 @rail:px-3 border-0 leading-normal",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "hover:bg-transparent hover:dark:bg-transparent",
            )}
        >
            <BotAvatar image_media_id={bot.image_media_id} hue={hue} face={(bot.face || "idle") as BotFace} />
            <Stack className="hidden @rail:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {bot.name}
                </Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {snippet}
                </Span>
            </Stack>
            <Stack className="hidden @rail:flex shrink-0 self-stretch items-end justify-start gap-1.5! pt-1.5">
                {at ? (
                    <Span className="text-[11px] leading-4 text-ink-secondary">
                        {relativeTime({ at: Number(at) })}
                    </Span>
                ) : null}
                {bot.unread && hue ? <UnreadDot hue={hue} /> : null}
            </Stack>
        </Link>
    );
}
