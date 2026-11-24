import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotIdRequest } from "@/src/schemas/bot-schema";

/**
 * A bot's core instructions and memory for its panel, and what it remembers
 * about the user reading it.
 */
export default async function fetchBotInstructions({ bot_id }: BotIdRequest) {
    return await fetchApi<
        BotIdRequest,
        APIResponseObject<{ system_prompt: string; memory: string; user_memory: string }>
    >(`/api/admin/bots/bot-instructions`, { method: "POST", body: { bot_id } });
}