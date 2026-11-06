type Params = {
    /**
     * A bot message's `tool_log` (JSON list of `{ name, ok }`).
     */
    tool_log?: string | null;
};

/**
 * How many tool calls a bot message's run made, or null when its run
 * wasn't recorded (a user message, an interim one, an older message).
 */
export default function toolLogCount({ tool_log }: Params): number | null {
    if (!tool_log) return null;

    try {
        const uses = JSON.parse(tool_log);

        return Array.isArray(uses) ? uses.length : null;
    } catch {
        return null;
    }
}
