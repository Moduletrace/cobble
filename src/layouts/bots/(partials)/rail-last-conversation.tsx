import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ArrowLeft } from "lucide-react";
import { twMerge } from "tailwind-merge";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { LastConversation } from "@/src/types";
import botStoneProps from "@/src/utils/bot-stone-props";

type Props = {
    conversation: LastConversation;
};

/**
 * Above the rail's list on settings and the rail pages: back to the
 * conversation this browser was last in, the bot's own chat or a
 * workspace's (named under the bot). The logo still goes to `/admin/bots`.
 * Avatar only when the rail collapses. The stone stays idle: this row
 * isn't live, so it never shows a status it can't keep current.
 */
export default function RailLastConversation({ conversation }: Props) {
    const { bot, workspace, href } = conversation;
    const title = workspace
        ? `Back to ${bot.name} in ${workspace.name}`
        : `Back to ${bot.name}`;

    return (
        <Stack className="shrink-0 gap-0! items-stretch px-2 @rail:px-3 pb-3">
            <Link
                href={href}
                title={title}
                aria-label={title}
                className={twMerge(
                    "flex shrink-0 h-14 items-center gap-3 rounded-default px-1 @rail:px-3 leading-normal text-ink",
                    "border-0 @rail:border @rail:border-solid @rail:border-hairline",
                    "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                    "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                )}
            >
                <Span className="hidden @rail:flex shrink-0 items-center justify-center text-ink-secondary">
                    <ArrowLeft size={16} aria-hidden />
                </Span>
                <Span className="shrink-0 flex items-center justify-center mx-auto @rail:mx-0">
                    <BotAvatar
                        image_media_id={bot.image_media_id}
                        {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    />
                </Span>
                <Stack className="hidden @rail:flex grow min-w-0 gap-0!">
                    <Span className="w-full text-sm font-bold leading-5 text-ink truncate">
                        {bot.name}
                    </Span>
                    <Span className="w-full text-xs leading-4 text-ink-secondary truncate">
                        {workspace ? `In ${workspace.name}` : "Back to the conversation"}
                    </Span>
                </Stack>
            </Link>
        </Stack>
    );
}
