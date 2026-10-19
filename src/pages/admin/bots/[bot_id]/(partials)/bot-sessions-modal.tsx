import { useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { History, Plus } from "lucide-react";
import type { BotWithLastMessage } from "@/src/types";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import useBotSessions from "../(hooks)/use-bot-sessions";
import BotSessionRow from "./bot-session-row";
import HeaderIconButton from "./header-icon-button";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
    /**
     * A bot message arrived in another session of this conversation.
     */
    has_other_unread?: boolean;
};

/**
 * The header's sessions icon. A conversation is split into sessions so a
 * bot's context never grows without bound; this lists them, searches
 * them, starts a fresh one, or reopens an old one to carry on.
 */
export default function BotSessionsModal({ bot, workspace_id, has_other_unread }: Props) {
    const [open, setOpen] = useState(false);
    const sessions = useBotSessions({ bot_id: Number(bot.id), workspace_id, open });
    const name = bot.name || "the bot";

    return (
        <Modal
            target={
                <HeaderIconButton
                    icon={History}
                    title={has_other_unread ? "Sessions: new messages in another session" : "Sessions"}
                />
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Row className="w-full gap-3! flex-nowrap items-start justify-between">
                <Stack className="min-w-0 gap-1! items-stretch">
                    <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">Sessions</H2>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {`Each session keeps ${name}'s context short. A new one starts with a summary of the last; reopen any to pick up where you left off.`}
                    </Span>
                </Stack>
                <Button
                    title="Start a new session"
                    type="button"
                    size="small"
                    loading={sessions.busy_id == "new"}
                    disabled={Boolean(sessions.busy_id)}
                    onClick={sessions.startSession}
                    className="shrink-0 gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New
                </Button>
            </Row>
            <Input
                id="bot-sessions-search"
                title="Search sessions"
                placeholder="Search titles, summaries and messages"
                autoComplete="off"
                defaultValue={sessions.query}
                onChange={(e) => sessions.setQuery(e.target.value)}
                wrapperWrapperProps={{ className: "mt-4" }}
            />
            <SettingsStatus status={sessions.error ? { error: true, msg: sessions.error } : undefined} />
            <Stack className="w-full mt-2 max-h-[60vh] overflow-y-auto gap-0! items-stretch">
                {sessions.sessions.map((session) => (
                    <BotSessionRow
                        key={session.id}
                        session={session}
                        loading={sessions.busy_id == session.id}
                        disabled={Boolean(sessions.busy_id)}
                        onOpen={() => sessions.reopenSession({ session_id: Number(session.id) })}
                    />
                ))}
                {sessions.sessions.length || sessions.loading ? null : (
                    <Span className="px-3 py-6 text-[13px] leading-[18px] text-ink-secondary">
                        {sessions.query.trim() ? `No session matches "${sessions.query.trim()}".` : "No sessions yet."}
                    </Span>
                )}
            </Stack>
        </Modal>
    );
}
