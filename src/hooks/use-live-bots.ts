import { useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotCreatedData, BotUpdatedData, BotWithLastMessage } from "@/src/types";
import useServerEvent from "./use-server-event";

type Params = {
    bots: BotWithLastMessage[];
    /**
     * The conversation open now: its new messages don't count as unread.
     */
    open_bot_id?: number;
    /**
     * Whose conversations the list shows: a workspace's, or (null) the
     * bots' own chats. Messages elsewhere leave the list alone.
     */
    workspace_id?: number | null;
};

/**
 * The crew, kept current from server pushes: faces and status lines,
 * latest messages, and unread for conversations that aren't open.
 */
export default function useLiveBots({ bots, open_bot_id, workspace_id = null }: Params) {
    const [live, setLive] = useState(bots);

    useServerEvent({
        event: "server:bot-created",
        onData: (data: BotCreatedData) => {
            /**
             * In a workspace only its own crew is listed; outside one, the
             * bots in the user's own chat (a member doesn't get a bot that
             * only joined a workspace).
             */
            const here = workspace_id
                ? data.workspace_ids.includes(Number(workspace_id))
                : data.in_own_chat;

            if (!here) return;

            setLive((prev) => {
                if (prev.some((bot) => bot.id == data.bot.id)) return prev;

                /** The coordinator stays pinned first; a new worker is the latest. */
                const first_worker = prev.findIndex((bot) => bot.kind != "coordinator");
                const at = first_worker < 0 ? prev.length : first_worker;

                return [...prev.slice(0, at), data.bot, ...prev.slice(at)];
            });
        },
    });

    useServerEvent({
        event: "server:bot-updated",
        onData: (data: BotUpdatedData) =>
            setLive((prev) =>
                prev.map((bot) =>
                    bot.id == data.id
                        ? { ...bot, face: data.face, status_line: data.status_line }
                        : bot,
                ),
            ),
    });

    useServerEvent({
        event: "server:bot-message",
        onData: (message: BUN_SQLITE_COBBLE_BOT_MESSAGES) => {
            if ((message.workspace_id || null) != workspace_id) return;

            setLive((prev) =>
                prev.map((bot) =>
                    bot.id == message.bot_id
                        ? {
                              ...bot,
                              last_message_text: message.text,
                              last_message_at: Number(message.created_at) || Date.now(),
                              unread:
                                  message.author == "bot" && bot.id != open_bot_id
                                      ? 1
                                      : bot.unread,
                          }
                        : bot,
                ),
            );
        },
    });

    return live;
}
