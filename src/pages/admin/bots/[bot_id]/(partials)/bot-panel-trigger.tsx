"use client";

import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import requestBotPanel from "@/src/utils/bot-panel-open-event";
import type { BotWithLastMessage } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The header owns the panel, so its avatar opens it directly; a stone
     * beside a message asks the header for it instead.
     */
    on_open?: () => void;
    /**
     * 35 beside the conversation's name, 28 beside a message.
     */
    size?: number;
    className?: string;
};

/**
 * The bot's stone: opens the bot's panel, which super admins and admins edit
 * and everyone else reads (their own memory there is theirs to rewrite). It
 * sits in the header beside the conversation's name and beside the bot's
 * messages in the thread.
 */
export default function BotPanelTrigger({
    bot,
    on_open = () => requestBotPanel(),
    size = 35,
    className,
}: Props) {
    const { pageProps } = useContext(AppContext);
    const name = bot.name || "This bot";
    const label = canManageCrew({ user_types: pageProps?.user_types })
        ? `Edit ${name}`
        : `About ${name}`;

    return (
        <Button
            title={label}
            type="button"
            variant="ghost"
            color="text"
            aria-label={label}
            aria-haspopup="dialog"
            onClick={on_open}
            className={twMerge(
                "shrink-0 p-0! rounded-default hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                className,
            )}
        >
            <BotAvatar
                image_media_id={bot.image_media_id}
                {...botStoneProps({
                    color: bot.color,
                    stone: bot.stone,
                    hue: bot.hue,
                })}
                face={(bot.face || "idle") as BotFace}
                size={size}
            />
        </Button>
    );
}