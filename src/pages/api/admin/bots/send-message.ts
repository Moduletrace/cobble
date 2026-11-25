import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import grabUserBotSession from "@/src/functions/backend/db/bot-sessions/grab-user-bot-session";
import reopenBotSession from "@/src/functions/backend/db/bot-sessions/reopen-bot-session";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";
import conversationLock from "@/src/functions/backend/db/bot-sessions/conversation-lock";
import insertUserMessage from "@/src/functions/backend/db/bots/insert-user-message";
import grabUserBotMessage from "@/src/functions/backend/db/bots/grab-user-bot-message";
import grabMessageIdByClientId from "@/src/functions/backend/db/bots/grab-message-id-by-client-id";
import deleteBotMessage from "@/src/functions/backend/db/bots/delete-bot-message";
import { logError } from "@/src/functions/backend/logger";
import grabAttachableMedia from "@/src/functions/backend/db/bots/grab-attachable-media";
import storeChatAttachments from "@/src/functions/backend/db/bot-files/store-chat-attachments";
import enqueueBotReply from "@/src/functions/backend/db/bots-queue/enqueue-bot-reply";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import { SendBotMessageRequestSchema } from "@/src/schemas/bot-schema";
import grabPrecacheManifest from "@/src/functions/server/pwa/grab-precache-manifest";
import isStaleClientBuild from "@/src/utils/is-stale-client-build";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import { grabBotMessageMaxChars } from "@/src/functions/backend/db/app-settings/grab-bot-message-max-chars";
import messageTooLongMessage from "@/src/utils/message-too-long-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Posts a message from the session user to a bot they chat with, in its
 * own chat or in a workspace, and queues the bot's reply, which
 * arrives over the WebSocket. The message goes in the conversation's
 * active session (the thread the page shows, reopening it when it isn't
 * active; the next one when it's full) and also to the user's other open
 * tabs. Files are uploaded first (`upload-attachment`) and sent as
 * `media_ids`.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const {
            bot_id,
            workspace_id,
            text,
            media_ids,
            reply_to_message_id,
            session_id,
            client_id,
            plan_mode,
            build_id,
        } = parseWithSchema({
                schema: SendBotMessageRequestSchema,
                data: body,
            });

        /**
         * The page's code is older than the build the server runs: nothing
         * is stored or queued, and the composer reloads into the new build
         * with what was typed kept.
         */
        if (
            isStaleClientBuild({
                client_build: build_id,
                server_build: grabPrecacheManifest()?.build_id,
            })
        ) {
            return {
                success: false,
                error: "stale_build",
                msg: "A newer version is available. Reloading to it.",
            };
        }

        const max_chars = await grabBotMessageMaxChars();

        if (text.length > max_chars) {
            throw new AppError(messageTooLongMessage({ length: text.length, max_chars }));
        }

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });
        const bot = conversation.bot;

        /**
         * A send whose answer never arrived is sent again with the same
         * client id, and the message it stored is already there: answering
         * that one, with its reply still queued (`enqueueBotReply` reuses the
         * open job), keeps the thread from showing the message twice with
         * the bot answering both copies.
         */
        if (client_id) {
            const stored_id = await grabMessageIdByClientId({
                user_id: user.id,
                bot_id: bot.id,
                workspace_id: conversation.workspace_id,
                client_id,
            }).catch(() => null);

            const stored = stored_id
                ? await grabUserBotMessage({ user_id: user.id, message_id: stored_id }).catch(
                      () => null,
                  )
                : null;

            if (stored?.id && stored.session_id) {
                await enqueueBotReply({
                    user_id: user.id,
                    bot_id: bot.id,
                    session_id: Number(stored.session_id),
                    message_id: Number(stored.id),
                    params: stored.plan_mode ? { plan_mode: true } : undefined,
                });

                wakeBotsQueue();

                return {
                    success: true,
                    singleRes: stored,
                };
            }
        }

        const media = await grabAttachableMedia({ user_id: Number(user.id), media_ids });

        /**
         * The send is one write against the conversation: a second one in
         * flight beside it would read the same active session and, when it
         * is full, roll it over a second time - writing into the session
         * the first call just closed, where the user never sees the message
         * or its reply.
         */
        const message = await conversationLock.run({
            key: `${user.id}:${bot.id}:${conversation.workspace_id || 0}`,
            task: async () => {
                /**
                 * The thread on screen is where the message goes: a routine's
                 * or a hook's session is chatted in by reopening it first
                 * (which closes the conversation's active one), never by
                 * posting into whichever session happened to be active. A
                 * session of another conversation is ignored, as the page
                 * does.
                 */
                const shown = session_id
                    ? await grabUserBotSession({ session_id, user_id: user.id })
                    : null;

                if (
                    shown?.id &&
                    !shown.ask_id &&
                    Number(shown.bot_id) == Number(bot.id) &&
                    (Number(shown.workspace_id) || null) ==
                        (Number(conversation.workspace_id) || null) &&
                    shown.status != "active"
                ) {
                    await reopenBotSession({ session_id: shown.id!, user_id: user.id });
                }

                const session = await ensureBotSession({
                    user_id: user.id,
                    bot_id: bot.id,
                    workspace_id: conversation.workspace_id,
                    rollover: true,
                });

                /**
                 * The quoted message only has to be in this conversation, not
                 * in the session the message lands in: sending can roll over
                 * to a new one, or the thread may have moved on.
                 */
                const reply_to = reply_to_message_id
                    ? await grabUserBotMessage({
                          user_id: user.id,
                          message_id: reply_to_message_id,
                      }).catch(() => null)
                    : null;

                if (
                    reply_to_message_id &&
                    (!reply_to ||
                        reply_to.bot_id != bot.id ||
                        (reply_to.workspace_id || null) != (conversation.workspace_id || null))
                ) {
                    throw new AppError(`That message is no longer in this conversation.`);
                }

                const stored = await insertUserMessage({
                    bot_id: bot.id,
                    session_id: Number(session.id),
                    workspace_id: conversation.workspace_id,
                    text,
                    reply_to,
                    media,
                    client_id,
                    plan_mode,
                });

                try {
                    await enqueueBotReply({
                        user_id: user.id,
                        bot_id: bot.id,
                        session_id: Number(session.id),
                        message_id: stored.id || 0,
                        params: plan_mode ? { plan_mode: true } : undefined,
                    });
                } catch (error: unknown) {
                    /**
                     * A message with no reply queued would sit in the thread
                     * with nothing ever answering it, while the composer has
                     * already taken its pending bubble down: it is taken back
                     * out, so the send fails where the user can see it and
                     * send it again.
                     */
                    await deleteBotMessage({ message_id: Number(stored.id) }).catch(() => null);

                    throw error;
                }

                return stored;
            },
        });

        /**
         * The files join the conversation's folder, so a later run can
         * search what the user sent now. The message and its reply are
         * stored and queued by now: a folder that can't be written costs a
         * search hit, never the message.
         */
        await storeChatAttachments({
            bot_id: bot.id,
            workspace_id: conversation.workspace_id,
            user_id: user.id,
            media,
        }).catch(async (error: unknown) => {
            await logError({
                title: `Files of message #${message.id} not added to its conversation`,
                error,
            }).catch(() => {});
        });

        wakeBotsQueue();

        await pushBotNotice({ bot_id: bot.id, message });

        return {
            success: true,
            singleRes: message,
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
