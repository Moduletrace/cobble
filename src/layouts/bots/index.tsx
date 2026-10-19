import React from "react";
import Row from "@moduletrace/twui/layout/Row";
import useWebSocket from "@moduletrace/twui/hooks/useWebSocket";
import BotsRail from "./(sections)/bots-rail";
import AddFlow from "./(partials)/add-flow";

/**
 * Full-bleed shell for every `/admin/*` page: the rail of bot conversations
 * and workspaces, then the page (a conversation, a workspace, or
 * settings), inside the Add flow both can open. No cards, no shadows;
 * regions are separated by 1px hairlines.
 */
export default function BotsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    /**
     * One socket for live bot updates (see `useServerEvent`).
     */
    useWebSocket({ url: "/ws" });

    return (
        <AddFlow>
            <Row className="w-full h-screen gap-0! flex-nowrap items-stretch overflow-hidden bg-paper text-ink">
                <BotsRail />
                <Row className="grow min-w-[480px] h-full gap-0! flex-nowrap items-stretch">
                    {children}
                </Row>
            </Row>
        </AddFlow>
    );
}
