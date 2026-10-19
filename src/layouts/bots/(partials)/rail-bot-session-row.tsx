import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { BotSessionListItem } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    session: BotSessionListItem;
    loading?: boolean;
    disabled?: boolean;
    onOpen: () => void;
};

/**
 * One session in the rail's sub-list under the open bot: aligned with the
 * bot's name, its title and how recent. The active one says so; any other
 * reopens on click.
 */
export default function RailBotSessionRow({
    session,
    loading,
    disabled,
    onOpen,
}: Props) {
    const active = session.status == "active";
    const at = session.last_activity_at || session.created_at;

    return (
        <Button
            title={
                active
                    ? "This is the current session"
                    : `Reopen "${session.title || "Untitled"}"`
            }
            type="button"
            variant="ghost"
            color="text"
            loading={loading}
            disabled={active || disabled}
            onClick={onOpen}
            buttonContentProps={{ className: "w-full min-w-0 flex-nowrap" }}
            className={twMerge(
                "w-full h-8 shrink-0 justify-start! items-center! gap-2! rounded-default px-2! @rail:pl-14! text-left text-ink dark:text-ink hover:bg-ink/5 hover:dark:bg-ink/5 focus-visible:ring-2 focus-visible:ring-ink",
                active &&
                    "bg-transparent hover:bg-transparent hover:dark:bg-transparent opacity-100!",
            )}
            loadingProps={{
                size: "smaller",
            }}
        >
            <Span
                className={twMerge(
                    "grow min-w-0 truncate text-xs leading-4 font-bold",
                    active ? "text-ink-secondary" : "text-ink",
                )}
            >
                {session.title || "Untitled session"}
            </Span>
            {session.unread && !active ? (
                <Span className="shrink-0 text-[11px] font-bold leading-4 text-ink">
                    New
                </Span>
            ) : null}
            <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                {active
                    ? "Current"
                    : at
                      ? relativeTime({ at: Number(at) })
                      : ""}
            </Span>
        </Button>
    );
}
