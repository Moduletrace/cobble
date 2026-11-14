import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

/**
 * Whether a message brings another bot's word back into a conversation
 * through the app (a crew request's outcome, the coordinator's answer to
 * an install request): stored on the user's side, since the bot answers it,
 * but shown as from the coordinator and read by the model as data.
 */
export default function isCrewMessage({
    message,
}: {
    message: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "from_ask_id" | "from_install_request_id">;
}) {
    return Boolean(message.from_ask_id || message.from_install_request_id);
}
