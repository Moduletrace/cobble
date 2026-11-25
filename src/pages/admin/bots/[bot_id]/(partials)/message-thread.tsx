import { useMemo, type ReactNode, type RefObject } from "react";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import type {
    BotMessageWithAttachments,
    BotWithLastMessage,
    PagePropsType,
} from "@/src/types";
import isCrewMessage from "@/src/utils/is-crew-message";
import useMessageSelection from "../(hooks)/use-message-selection";
import usePullToRefresh from "../(hooks)/use-pull-to-refresh";
import useSessionGallery from "../(hooks)/use-session-gallery";
import useThreadScroll from "../(hooks)/use-thread-scroll";
import { SessionGalleryContext } from "../(data)/session-gallery-context";
import { LastUserMessageContext } from "../(data)/message-answer-context";
import groupMessages from "../(utils)/group-messages";
import threadMessages from "../(utils)/thread-messages";
import BotThinkingRow from "./bot-thinking-row";
import MessageGroupBlock from "./message-group-block";
import OlderMessagesLoader from "./older-messages-loader";
import UnansweredReplyRow from "./unanswered-reply-row";
import PullToRefreshIndicator from "./pull-to-refresh-indicator";
import QuoteSelectionButton from "./quote-selection-button";
import ScrollToBottomButton from "./scroll-to-bottom-button";
import quotableText from "../(utils)/quotable-text";

type Props = {
    bot: BotWithLastMessage;
    messages: BotMessageWithAttachments[];
    /**
     * The latest step of the bot's active task, shown while it works.
     */
    progress?: string | null;
    /**
     * The latest step of the reply running here, shown while it thinks.
     */
    reply_progress?: string | null;
    /**
     * The last message is still on its way to the server.
     */
    receiving?: boolean;
    /**
     * A reply is due here, as the conversation reads it: that read also
     * knows how many replies the session still has to come, so a message a
     * run left unanswered (a stopped reply, a job pruned) doesn't wait on a
     * thinking row that will never move.
     */
    awaiting_reply?: boolean;
    /**
     * The session shown was carried into a newer one: its thread is a record
     * to read, so a last word of the user's isn't a reply that never came.
     */
    moved_on?: boolean;
    /**
     * This session has an active task.
     */
    has_task?: boolean;
    /**
     * The crew request the bot is answering here, whose answer runs in a
     * hidden session, so the row can say who it's answering.
     */
    answer_ask?: PagePropsType["answer_ask"];
    /**
     * The bot message the user asked to run again, while its answer is on
     * its way: the message itself steps out of the thread (a stopped run's
     * notice would otherwise say the bot stopped right above the row), and
     * the row stands whether or not the thread looks unanswered.
     */
    rerun_message_id?: number | null;
    /**
     * The session shown: the debug logs read the run it's working on.
     */
    session_id?: number | null;
    /**
     * The debug logs under the thinking row, streaming what the run does.
     * The conversation keeps it, remembered per user.
     */
    debug_open?: boolean;
    /**
     * Shows or hides the debug logs under the thinking row.
     */
    on_toggle_debug?: () => void;
    /**
     * Shown after the messages, or in the middle of an empty thread, e.g.
     * that the bot has no model to answer with.
     */
    notice?: ReactNode;
    /**
     * Quotes text selected in a message in the composer.
     */
    onQuote?: (params: { text: string }) => void;
    /**
     * Reads the conversation again, pulled up from the bottom of the
     * thread on a phone.
     */
    onReload: () => Promise<void>;
    /**
     * The session's older messages, loaded at the top of the thread.
     */
    older?: {
        has_more: boolean;
        /**
         * The thread reaches the start of its oldest session, which carries
         * on from another one that can be opened above it.
         */
        has_previous?: boolean;
        loading: boolean;
        error?: string;
        loadOlder: () => void;
        /**
         * The session this one carries on from, as the page that reads it.
         */
        previous_session_href?: string | null;
    };
};

/**
 * Bottom-anchored: the stack sits 24px above the composer rule and grows
 * upward. Empty space belongs at the top. New messages announce politely.
 * While the bot works on a reply or a task, a status row sits under the
 * last one, and each request the bot has open with the crew shows where
 * its bots stand until it's done. Text selected in a message can be quoted in the composer.
 * Older messages load as it scrolls to the top, and the session before
 * this one is linked above the thread as its own page (shown only, never
 * put in the bot's prompt); the reversed column keeps
 * the view where it was as they land above it. The thread follows new
 * messages while it sits at its bottom, stays put while it's scrolled up
 * and then offers a button to get back down. Pulled up past its bottom on
 * a phone, it offers to read the conversation again.
 */
export default function MessageThread({
    bot,
    messages,
    progress,
    reply_progress,
    receiving,
    awaiting_reply,
    moved_on,
    session_id,
    debug_open,
    on_toggle_debug,
    has_task,
    answer_ask,
    rerun_message_id,
    notice,
    onQuote,
    onReload,
    older,
}: Props) {
    /**
     * What the thread shows: the message being run again is left out while
     * that run works, and comes back above the answer it writes.
     */
    const shown = useMemo(
        () => threadMessages({ messages, rerun_message_id }),
        [messages, rerun_message_id],
    );
    const groups = useMemo(() => groupMessages({ messages: shown }), [shown]);
    /**
     * The bot's own last word, when it is the thread's last too, so it can
     * be run again. A crew message and an install request's answer are not
     * the bot's reply.
     */
    const last_bot_id = useMemo(() => {
        const newest = shown[shown.length - 1];

        if (!newest || newest.author != "bot" || isCrewMessage({ message: newest }))
            return null;

        return Number(newest.id) || null;
    }, [shown]);
    const session_gallery = useSessionGallery({ messages: shown });
    /**
     * The user's newest message answers every ask above it: a take-over
     * card stops waiting for them once they've written, which is how they
     * hand the computer back.
     */
    const last_user_id = useMemo(() => {
        for (let index = shown.length - 1; index >= 0; index--) {
            const message = shown[index];

            if (message?.author == "user") return Number(message.id) || null;
        }

        return null;
    }, [shown]);
    /**
     * The user's own message the thread ends on, with nothing on its way: a
     * stopped run, or one that ended without a word, leaves it waiting
     * forever. The row under it says so and offers to answer it again.
     */
    const last_shown = shown[shown.length - 1];
    const unanswered =
        !awaiting_reply && !receiving && !moved_on && last_shown?.author == "user"
            ? last_shown
            : null;
    const scroll = useThreadScroll({ messages: shown });
    const pull_state = usePullToRefresh({
        column_ref: scroll.column_ref,
        content_ref: scroll.content_ref,
        at_bottom: scroll.at_bottom,
        on_refresh: onReload,
    });
    const { selection, clear } = useMessageSelection({ ref: scroll.column_ref });

    return (
        <Stack className="relative grow min-h-0 gap-0! items-stretch">
            <Stack
                componentRef={scroll.column_ref as RefObject<HTMLDivElement>}
                className="grow min-h-0 gap-0! items-stretch overflow-y-auto overscroll-contain flex-col-reverse"
                onScroll={scroll.on_scroll}
            >
                <Stack
                    componentRef={scroll.content_ref as RefObject<HTMLDivElement>}
                    role="log"
                    aria-live="polite"
                    aria-label={`Conversation with ${bot.name}`}
                    className={twMerge(
                        "w-full max-w-container mx-auto gap-4! items-stretch px-3 md:px-6 pt-6 pb-6",
                        notice && !shown.length && "grow justify-center",
                    )}
                >
                    {older?.has_more ? (
                        <OlderMessagesLoader
                            loading={older.loading}
                            error={older.error}
                            onLoad={older.loadOlder}
                        />
                    ) : older?.previous_session_href ? (
                        <OlderMessagesLoader
                            href={older.previous_session_href}
                            label="Show the previous session"
                        />
                    ) : null}
                    <SessionGalleryContext.Provider value={session_gallery}>
                        <LastUserMessageContext.Provider value={last_user_id}>
                            {groups.map((group) => (
                                <MessageGroupBlock
                                    key={group.key}
                                    bot={bot}
                                    group={group}
                                    last_bot_id={last_bot_id}
                                />
                            ))}
                        </LastUserMessageContext.Provider>
                    </SessionGalleryContext.Provider>
                    {notice}
                    <BotThinkingRow
                        bot={bot}
                        progress={progress}
                        answer_ask={answer_ask}
                        answering_ask={Boolean(answer_ask) && bot.face == "working"}
                        reply_progress={reply_progress}
                        awaiting_reply={Boolean(awaiting_reply)}
                        receiving={receiving}
                        has_task={has_task}
                        session_id={session_id}
                        debug_open={debug_open}
                        on_toggle_debug={on_toggle_debug}
                    />
                    {unanswered ? (
                        <UnansweredReplyRow bot={bot} message={unanswered} />
                    ) : null}
                </Stack>
            </Stack>
            {scroll.jump_visible ? (
                <ScrollToBottomButton onClick={scroll.jump_to_bottom} />
            ) : null}
            <PullToRefreshIndicator state={pull_state} onReload={onReload} />
            {selection && onQuote ? (
                <QuoteSelectionButton
                    selection={selection}
                    onQuote={() => {
                        onQuote({ text: quotableText({ range: selection.range }) });
                        clear();
                    }}
                />
            ) : null}
        </Stack>
    );
}
