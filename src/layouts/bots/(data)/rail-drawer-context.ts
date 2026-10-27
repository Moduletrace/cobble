"use client";

import { createContext } from "react";

export type RailDrawerContextObject = {
    open: boolean;
    setOpen: (open: boolean) => void;
    /**
     * False on a page without the rail (`isRaillessPage`), where the menu
     * button has nothing to open.
     */
    has_rail: boolean;
};

/**
 * The rail is a slide-over below `md`, an inline rail above it. The
 * pane headers' menu button and the rail itself share this.
 */
export const RailDrawerContext = createContext<RailDrawerContextObject>({
    open: false,
    setOpen: () => {},
    has_rail: true,
});
