import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotSessionsModal from "@/src/components/general/bot-sessions-modal";
import { AppData } from "@/src/data/app-data";
import useBotSessions from "@/src/hooks/use-bot-sessions";
import useShownSession from "@/src/hooks/use-shown-session";
import conversationHref from "@/src/utils/conversation-href";
import type { BotWithLastMessage } from "@/src/types";
import RailBotSessionRow from "./rail-bot-session-row";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
};

/**
 * Under the open bot in the rail: its latest sessions, latest first (plus
 * the one on screen when it's older). The one on screen (`?session_id=`,
 * else the active one) is Current. Then,
 * once there are more than the ones listed, "All sessions" which opens the
 * conversation's sessions modal. Hidden when the rail collapses to icons.
 */
export default function RailBotSessions({ bot, workspace_id }: Props) {
    const on_screen = useShownSession({ bot_id: Number(bot.id), workspace_id });
    const sessions = useBotSessions({
        bot_id: Number(bot.id),
        workspace_id,
        open: true,
        limit: AppData.RailRecentSessions + 1,
        refresh_key: on_screen ? `${on_screen.id}:${on_screen.status}` : null,
    });
    const recent = sessions.sessions.slice(0, AppData.RailRecentSessions);
    /**
     * The session on screen is always listed, even when it's older than
     * the latest ones.
     */
    const shown =
        on_screen?.id && !recent.some((session) => session.id == on_screen.id)
            ? [...recent, { ...on_screen, message_count: 0 }]
            : recent;

    if (!shown.length) return null;

    return (
        <Stack className="hidden @rail:flex w-full shrink-0 flex-col gap-0! items-stretch pb-1">
            <Stack className="relative w-full flex-col gap-0! items-stretch">
                <Span
                    aria-hidden
                    className="pointer-events-none absolute left-7 -translate-x-1/2 -top-2 bottom-0 w-px bg-hairline"
                />
                {shown.map((session) => (
                    <RailBotSessionRow
                        key={session.id}
                        session={session}
                        loading={sessions.busy_id == session.id}
                        disabled={Boolean(sessions.busy_id)}
                        current={on_screen?.id ? on_screen.id == session.id : session.status == "active"}
                        onOpen={() =>
                            session.status == "active"
                                ? window.location.assign(conversationHref({ bot_id: Number(bot.id), workspace_id }))
                                : sessions.reopenSession({ session_id: Number(session.id) })
                        }
                    />
                ))}
            </Stack>
            {sessions.sessions.length > AppData.RailRecentSessions ? (
                <BotSessionsModal
                    bot={bot}
                    workspace_id={workspace_id}
                    target={
                        <Button
                            title="Open all sessions"
                            type="button"
                            variant="ghost"
                            color="text"
                            className="w-full h-8 shrink-0 justify-start! items-center! gap-2! rounded-default px-2! @rail:pl-14! text-left text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
                        >
                            <Span className="text-[11px] font-bold leading-4">All sessions</Span>
                        </Button>
                    }
                />
            ) : null}
        </Stack>
    );
}
