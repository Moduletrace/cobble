"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import { AppContext } from "@/src/pages/__root";
import useConnectionEpoch from "@/src/hooks/use-connection-epoch";
import useOnlineStatus from "@/src/hooks/use-online-status";
import { RailDrawerContext } from "./(data)/rail-drawer-context";
import BotsRail from "./(sections)/bots-rail";
import LiveSocket from "./(sections)/live-socket";
import AddFlow from "./(partials)/add-flow";
import OfflineBanner from "./(partials)/offline-banner";

/**
 * Full-bleed shell for every `/admin/*` page: the rail of bot conversations
 * and workspaces, then the page (a conversation, a workspace, or
 * settings), inside the Add flow both can open. No cards, no shadows;
 * regions are separated by 1px hairlines. Below `md` the rail slides over
 * the page instead of taking width. Height is `dvh`, so the on-screen
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

    const drawer = useMemo(
        () => ({ open: drawer_open, setOpen: setDrawerOpen }),
        [drawer_open],
    );

    return (
        <RailDrawerContext.Provider value={drawer}>
            <AddFlow>
                <Stack className="w-full h-dvh gap-0! items-stretch overflow-hidden bg-paper text-ink pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                    {online ? null : <OfflineBanner />}
                    <Row className="grow min-h-0 w-full gap-0! flex-nowrap items-stretch overflow-hidden">
                        <BotsRail />
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
