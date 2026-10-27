import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { HarnessMessage } from "@/src/harness/types";
import crewMessageBlock from "@/src/utils/crew-message-block";

/**
 * The room as model turns: the coordinator's own messages as its turns,
 * every other bot's as user turns fenced with who said it. Neighbouring
 * turns from one side are joined, since some providers reject repeats.
 */
export default function chatroomTurns({
    messages,
    coordinator_id,
    requester_id,
    names,
}: {
    messages: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "bot_id" | "text">[];
    coordinator_id: number;
    requester_id: number;
    names: Map<number, string>;
}): HarnessMessage[] {
    const turns: { role: "user" | "assistant"; text: string }[] = [];

    for (const message of messages) {
        const body = message.text?.trim();

        if (!body) continue;

        const own = Number(message.bot_id) == coordinator_id;
        const role = own ? "assistant" : "user";

        if (!turns.length && own) continue;

        const name = names.get(Number(message.bot_id)) || "A bot";
        const text = own
            ? body
            : crewMessageBlock({
                  from: `${name} (bot ${message.bot_id})${Number(message.bot_id) == requester_id ? ", who asked" : ""}`,
                  text: body,
              });

        const last = turns[turns.length - 1];

        if (last?.role == role) {
            last.text = `${last.text}\n\n${text}`;
        } else {
            turns.push({ role, text });
        }
    }

    return turns.map((turn) => ({ role: turn.role, content: turn.text }));
}
