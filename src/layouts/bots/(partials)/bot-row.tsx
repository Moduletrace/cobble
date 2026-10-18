import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import BotStone from "@/src/components/general/bot-stone";
import type { BotWithLastMessage } from "@/src/types";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import relativeTime from "@/src/utils/relative-time";
import UnreadDot from "./unread-dot";

type Props = {
    bot: BotWithLastMessage;
    selected?: boolean;
    /**
     * Replaces the last-message snippet (the coordinator shows crew status).
     */
    subtitle?: string;
};

/**
 * 48px rail row. Status is the face: no badges, spinners or state dots.
 * Selected is ink at 5%, never a hue.
 */
export default function BotRow({ bot, selected, subtitle }: Props) {
    const hue = (bot.hue || null) as BotHue | null;
    const snippet = subtitle ?? bot.last_message_text ?? bot.role ?? "";
    const at = bot.last_message_at || bot.last_activity_at;

    return (
        <Link
            href={`/admin/bots/${bot.id}`}
            aria-current={selected ? "page" : undefined}
            title={bot.name}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 lg:px-3 border-0 leading-normal",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <BotStone hue={hue} face={(bot.face || "idle") as BotFace} />
            <Stack className="hidden lg:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {bot.name}
                </Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {snippet}
                </Span>
            </Stack>
            <Stack className="hidden lg:flex shrink-0 self-stretch items-end justify-start gap-1.5! pt-1.5">
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
