type Params = {
    text: string;
};

/**
 * The opening of the line the app adds after a bot's past message, naming
 * the tools its run called and the user's reactions to it
 * (`botMessagesToHarness`).
 */
export const AppRecordPrefix = "[App record:";

/**
 * Whether a line is the app's own shape: it opens with the prefix after
 * its whitespace, the way `botMessagesToHarness` writes it. The same text
 * inside a sentence, in quotes or in a code span is the bot talking about
 * the record, not a record, so it is neither stripped nor faulted: a bot
 * that has to correct itself names the thing it got wrong.
 */
function isAppRecordLine({ line }: { line: string }) {
    return line.trim().startsWith(AppRecordPrefix);
}

/**
 * The lines of a bot's answer that read as the app's own record line. Only
 * these can be taken for the app's word, so they are the ones the app
 * strips from what it stores (`stripAppRecords`) and the ones the reply's
 * record is checked against (`replyClaimProblems`).
 */
export function appRecordLines({ text }: Params): string[] {
    if (!text.includes(AppRecordPrefix)) return [];

    return text.split("\n").filter((line) => isAppRecordLine({ line }));
}

/**
 * Drops every app record line a bot copied into its own answer: only the
 * app writes them, so a bot can't vouch for itself in the next turn.
 */
export default function stripAppRecords({ text }: Params) {
    if (!text.includes(AppRecordPrefix)) return text;

    return text
        .split("\n")
        .filter((line) => !isAppRecordLine({ line }))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
