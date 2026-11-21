"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import { AppContext } from "@/src/pages/__root";
import useConnectionEpoch from "@/src/hooks/use-connection-epoch";
import useOnlineStatus from "@/src/hooks/use-online-status";
import useHorizontalSwipe from "@/src/hooks/use-horizontal-swipe";
import requestBotPanel from "@/src/utils/bot-panel-open-event";
import { RailDrawerContext } from "./(data)/rail-drawer-context";
import BotsRail from "./(sections)/bots-rail";
import LiveSocket from "./(sections)/live-socket";
import AddFlow from "./(partials)/add-flow";
import OfflineBanner from "./(partials)/offline-banner";
import useLiveCrewRefresh from "./(hooks)/use-live-crew-refresh";
import isRaillessPage from "./(utils)/is-railless-page";
import railWorkspaceId from "./(utils)/rail-workspace-id";

/**
 * Full-bleed shell for every `/admin/*` page: the rail of bot conversations
 * and workspaces, then the page (a conversation, a workspace, or
 * settings), inside the Add flow both can open. A graphic's own page
 * (`isRaillessPage`) goes without the rail. No cards, no shadows;
 * regions are separated by 1px hairlines. Below `md` the rail slides over
 * the page instead of taking width, and two swipes anywhere on the page
 * move between panes: to the right opens the rail's drawer, to the left the
 * conversation's bot panel. Height is `dvh`, so the on-screen
 * keyboard doesn't push the composer out of view.
 */
export default function BotsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { pageProps } = useContext(AppContext);
    const pathname = pageProps?.url?.pathname;

    const [drawer_open, setDrawerOpen] = useState(false);
    const epoch = useConnectionEpoch();
    const online = useOnlineStatus();

    /**
     * Opening a conversation closes the drawer on a phone.
     */
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!drawer_open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key == "Escape") setDrawerOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [drawer_open]);

    const has_rail = !isRaillessPage({ pathname });

    /**
     * The phone's sideways swipes: right opens the rail's drawer, left asks
     * the page for its bot panel (`cobble:open-bot-panel`, which the
     * conversation's header answers). Neither runs while the drawer is
     * open, so a swipe on it cannot open the other panel above it.
     */
    useHorizontalSwipe({
        enabled: !drawer_open,
        on_swipe_right: () => {
            if (has_rail) setDrawerOpen(true);
        },
        on_swipe_left: () => requestBotPanel(),
    });

    /**
     * The crew the rail lists, read again whenever the user comes back to
     * the page: pushes that never arrived leave it stale until a reload.
     */
    const workspace_id = railWorkspaceId({ workspace: pageProps?.workspace, pathname });

    useLiveCrewRefresh({ workspace_id });

    const drawer = useMemo(
        () => ({ open: drawer_open, setOpen: setDrawerOpen, has_rail }),
        [drawer_open, has_rail],
    );

    return (
        <RailDrawerContext.Provider value={drawer}>
            <AddFlow>
                <Stack className="w-full h-dvh gap-0! items-stretch overflow-hidden bg-paper text-ink pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                    {online ? null : <OfflineBanner />}
                    <Row className="grow min-h-0 w-full gap-0! flex-nowrap items-stretch overflow-hidden">
                        {has_rail ? <BotsRail /> : null}
                        <Row className="grow min-w-0 h-full gap-0! flex-nowrap items-stretch">
                            {children}
                        </Row>
                    </Row>
                </Stack>
                <LiveSocket key={epoch} />
            </AddFlow>
        </RailDrawerContext.Provider>
    );
}
