import grabBotSavedText, {
    type BotSavedTextKind,
} from "@/src/functions/backend/db/bots/grab-bot-saved-text";

type Params = {
    kind: BotSavedTextKind;
    bot_id: number | string;
    user_id?: number | string;
    workspace_id?: number | string | null;
    /**
     * What the bot asked to save.
     */
    expected: string;
};

/**
 * Reads a saved memory or instructions back and throws unless it holds
 * what the bot sent, so the bot never reports a save that didn't take.
 */
export default async function checkSavedText({ expected, ...params }: Params) {
    const stored = await grabBotSavedText(params);

    if (stored.trim() != expected.trim()) {
        throw new Error(`The save didn't take: what's stored doesn't match what you sent. Try again.`);
    }
}
