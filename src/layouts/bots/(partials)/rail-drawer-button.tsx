"use client";

import { useContext } from "react";
import { Menu } from "lucide-react";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import { RailDrawerContext } from "../(data)/rail-drawer-context";

/**
 * Opens the rail's drawer below `md`; the inline rail has no need for it,
 * and a page without the rail has none to open.
 */
export default function RailDrawerButton() {
    const { setOpen, has_rail } = useContext(RailDrawerContext);

    if (!has_rail) return null;

    return (
        <span className="inline-flex md:hidden">
            <HeaderIconButton
                icon={Menu}
                title="Open the bots rail"
                onClick={() => setOpen(true)}
            />
        </span>
    );
}
