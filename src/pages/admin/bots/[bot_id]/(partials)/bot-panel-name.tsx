"use client";

import { useContext } from "react";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
    on_open: () => void;
};

/**
 * The conversation's name: the page's heading, and a second way into the
 * bot's panel beside its avatar, for everyone who can reach it.
 */
export default function BotPanelName({ bot, on_open }: Props) {
    const { pageProps } = useContext(AppContext);
    const name = bot.name || "This bot";
    const label = canManageCrew({ user_types: pageProps?.user_types })
        ? `Edit ${name}`
        : `About ${name}`;

    return (
        <H1 className="min-w-0 text-lg! leading-6! tracking-normal! font-bold text-ink">
            <Button
                title={label}
                type="button"
                variant="ghost"
                color="text"
                aria-haspopup="dialog"
                onClick={on_open}
                buttonContentProps={{ className: "min-w-0 gap-0!" }}
                className="min-w-0 max-w-full justify-start px-0! py-0! text-lg! leading-6! tracking-normal! font-bold! text-ink! text-left rounded-default hover:bg-transparent! hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink"
            >
                <Span className="min-w-0 truncate">{bot.name}</Span>
            </Button>
        </H1>
    );
}