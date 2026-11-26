/**
 * The composer's slash commands. The session trio (`/new`, `/continue`,
 * `/clear`) acts on the conversation's session and reloads the page; the
 * modal ones open what the conversation header's menu opens (the list loads
 * then, so nothing costs anything until picked); `/copy` and `/stop` do the
 * menu's own two actions from the input; `/panel` slides the bot panel in
 * and `/settings` goes to the bot's settings page. Which ones a user sees is
 * `visibleComposerCommands`, mirroring the menu's own gates.
 */
export type ComposerCommandAction =
    | "session"
    | "modal"
    | "copy"
    | "stop"
    | "panel"
    | "link";

export type ComposerCommand = {
    name: string;
    description: string;
    action: ComposerCommandAction;
    /** For a session command: the API the composer posts to. */
    path?: "new-session" | "continue-session" | "delete-session";
    /** For a link command: where it goes. */
    href?: (params: { bot_id: number }) => string;
};

export const ComposerCommands: ComposerCommand[] = [
    { name: "new", description: "Start a fresh session", action: "session", path: "new-session" },
    { name: "continue", description: "Carry this conversation into a new session, with a summary", action: "session", path: "continue-session" },
    { name: "clear", description: "Delete this session and start a new one", action: "session", path: "delete-session" },
    { name: "sessions", description: "List this bot's chat sessions", action: "modal" },
    { name: "files", description: "Browse the bot's files", action: "modal" },
    { name: "tasks", description: "See the tasks this bot works on", action: "modal" },
    { name: "routines", description: "See the routines this bot runs", action: "modal" },
    { name: "hooks", description: "See the hooks that wake this bot", action: "modal" },
    { name: "computers", description: "See the computers this bot works on", action: "modal" },
    { name: "models", description: "See and change the models this bot runs on", action: "modal" },
    { name: "instructions", description: "Edit what this bot does in this workspace", action: "modal" },
    { name: "panel", description: "Open the bot's panel", action: "panel" },
    { name: "copy", description: "Copy this session as markdown", action: "copy" },
    { name: "stop", description: "Stop the bot's queued and running work", action: "stop" },
    { name: "settings", description: "Open this bot's settings", action: "link", href: ({ bot_id }) => `/admin/settings/bots/${bot_id}` },
];
