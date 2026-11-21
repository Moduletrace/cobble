"use client";

import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BotWithLastMessage } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    bot: BotWithLastMessage;
    on_open: () => void;
};

/**
 * The avatar beside the conversation's name: opens the bot's panel to edit
 * it, for super admins and admins. Everyone else sees the avatar alone.
 */
export default function BotPanelTrigger({ bot, on_open }: Props) {
    const { pageProps } = useContext(AppContext);
    const name = bot.name || "This bot";
    const can_edit = canManageCrew({ user_types: pageProps?.user_types });

    const avatar = (
        <BotAvatar
            image_media_id={bot.image_media_id}
            {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
            face={(bot.face || "idle") as BotFace}
            size={35}
        />
    );

    if (!can_edit) {
        return <Stack className="shrink-0">{avatar}</Stack>;
    }

    return (
        <Button
            title={`Edit ${name}`}
            type="button"
            variant="ghost"
            color="text"
            aria-label={`Edit ${name}`}
            aria-haspopup="dialog"
            onClick={on_open}
            className="shrink-0 p-0! rounded-default hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
            {avatar}
        </Button>
    );
}