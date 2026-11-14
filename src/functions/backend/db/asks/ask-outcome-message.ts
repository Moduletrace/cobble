import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import type { AskStatus } from "@/src/dict/ask-dict";
import askRef from "@/src/utils/ask-ref";
import botRef from "@/src/utils/bot-ref";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    status: AskStatus;
    outcome?: string | null;
};

/**
 * The user-side message that brings a request's outcome back to the bot
 * that made it. Stored on the user's side (the bot answers it), shown as
 * from the coordinator and fenced as data to the model (`isCrewMessage`).
 */
export default function askOutcomeMessage({ ask, status, outcome }: Params) {
    const title = ask.title ? `"${ask.title}"` : "your crew request";
    /** The pill the chat renders: it links to the conversation it ran in. */
    const pill = ask.id ? ` ${askRef({ id: ask.id })}` : "";
    const target = ask.target_bot_id ? botRef({ id: ask.target_bot_id }) : "the crew";

    if (status == "refused") {
        return `The coordinator turned down ${title}${pill}:\n\n${ask.gate_note || outcome || "No reason was given."}`;
    }

    if (status == "stopped") {
        return `The coordinator stopped ${title}${pill}: ${outcome || "the user stopped it, so there is no answer."}`;
    }

    if (status == "failed") {
        return `The coordinator passed ${title}${pill} to ${target}, but it couldn't answer:\n\n${outcome || "No reason was given."}`;
    }

    return `The coordinator passed ${title}${pill} to ${target}, which answered:\n\n${outcome || ""}`;
}
