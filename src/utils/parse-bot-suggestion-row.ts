type Params = {
    row: { steps?: string | null };
};

/**
 * A `bot_suggestions` row's stored JSON read back: the steps it holds, and
 * none if the column isn't readable.
 */
export default function parseBotSuggestionRow({ row }: Params): { steps: string[] } {
    if (!row.steps) return { steps: [] };

    try {
        const steps = JSON.parse(row.steps) as unknown;

        return {
            steps: Array.isArray(steps)
                ? steps.filter((step): step is string => typeof step == "string" && Boolean(step.trim()))
                : [],
        };
    } catch {
        return { steps: [] };
    }
}