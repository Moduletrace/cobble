import { createContext } from "react";

/**
 * The bot and workspace file chips look a file up in, for messages shown
 * outside their conversation (a hook's thread). Null: the page's own.
 */
export const FilePlaceContext = createContext<{ bot_id: number; workspace_id: number | null } | null>(null);
