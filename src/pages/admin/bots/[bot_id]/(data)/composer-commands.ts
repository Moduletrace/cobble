/**
 * The composer's slash commands: what `/new`, `/continue` and `/clear` do
 * to the conversation's session, and how the list above the input
 * describes them.
 */
export type ComposerCommand = {
    name: "new" | "continue" | "clear";
    description: string;
};

export const ComposerCommands: ComposerCommand[] = [
    { name: "new", description: "Start a fresh session" },
    { name: "continue", description: "Carry this conversation into a new session, with a summary" },
    { name: "clear", description: "Delete this session and start a new one" },
];