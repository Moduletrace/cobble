import React from "react";
import type { AddKind } from "../(dict)/add-choices-dict";

export type AddFlow = {
    /**
     * Opens the Add modal: pick a bot, a workspace or a computer.
     */
    openAdd: () => void;
    /**
     * Opens one add form straight away (the rail's "+" beside Workspaces,
     * a workspace page's "New computer").
     */
    openForm: (params: { kind: AddKind }) => void;
    /**
     * Opens the link-bots modal of the workspace being viewed (the
     * workspace rail's "+"), whose "New bot" opens the bot form over it.
     */
    openLinkBots: () => void;
};

/**
 * The Add flow, shared by the rail and the pages in the bots layout.
 */
export const AddFlowContext = React.createContext<AddFlow>({
    openAdd: () => {},
    openForm: () => {},
    openLinkBots: () => {},
});
