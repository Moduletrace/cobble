import React from "react";
import Row from "@moduletrace/twui/layout/Row";
import BotsRail from "./(sections)/bots-rail";

/**
 * Full-bleed chat shell for `/admin/bots/*`: the rail of bot conversations,
 * then the page (conversation + working-on panel). No cards, no shadows;
 * regions are separated by 1px hairlines.
 */
export default function BotsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Row className="w-full h-screen gap-0! flex-nowrap items-stretch overflow-hidden bg-paper text-ink">
            <BotsRail />
            <Row className="grow min-w-[480px] h-full gap-0! flex-nowrap items-stretch">
                {children}
            </Row>
        </Row>
    );
}
