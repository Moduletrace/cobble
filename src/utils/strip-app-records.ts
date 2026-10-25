type Params = {
    text: string;
};

/**
 * The opening of the line the app adds after a bot's past message, naming
 * the tools its run called (`botMessagesToHarness`).
 */
export const AppRecordPrefix = "[App record:";

/**
 * Drops every app record line a bot copied into its own answer: only the
 * app writes them, so a bot can't vouch for itself in the next turn.
 */
export default function stripAppRecords({ text }: Params) {
    if (!text.includes(AppRecordPrefix)) return text;

    return text
        .split("\n")
        .filter((line) => !line.trim().startsWith(AppRecordPrefix))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
