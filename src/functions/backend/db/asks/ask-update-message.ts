import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import askRef from "@/src/utils/ask-ref";
import botRef from "@/src/utils/bot-ref";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    /**
     * The result text, already stripped of question refs.
     */
    text: string;
    /**
     * The run that produced this result failed.
     */
    failed?: boolean;
};

/**
 * A result that comes back while a crew request is still open: the target
 * bot finished one piece of the work, but more is still running, so the
 * request isn't ended yet. Stored on the user's side like the final outcome
 * (`from_ask_id`), and says plainly that more may follow so the asking bot
 * doesn't treat it as the whole answer.
 */
export default function askUpdateMessage({ ask, text, failed }: Params) {
    const title = ask.title ? `"${ask.title}"` : "your crew request";
    const pill = ask.id ? ` ${askRef({ id: ask.id })}` : "";
    const target = ask.target_bot_id ? botRef({ id: ask.target_bot_id }) : "the crew";

    const head = failed
        ? `${target} couldn't finish one piece of ${title}${pill}:`
        : `${target} sent a response on ${title}${pill}:`;

    return `${head}\n\n${text}\n\n_The request is still open - more may follow._`;
}
