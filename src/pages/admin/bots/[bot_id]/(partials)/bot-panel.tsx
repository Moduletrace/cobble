"use client";

import { useContext, useEffect } from "react";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Loading from "@moduletrace/twui/elements/Loading";
import { X } from "lucide-react";
import SidePanel from "@/src/components/general/side-panel";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import { BotPanelOpenEvent } from "@/src/utils/bot-panel-open-event";
import type { BotWithLastMessage } from "@/src/types";
import BotForm from "@/src/layouts/bots/(partials)/bot-form";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import useTopModalEscape from "@/src/hooks/use-top-modal-escape";
import useBotInstructions from "../(hooks)/use-bot-instructions";
import BotPanelTrigger from "./bot-panel-trigger";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The header owns it, since the avatar and the name both open the panel.
     */
    open: boolean;
    on_open: () => void;
    on_close: () => void;
};

/**
 * The bot's profile (picture, name, job, colour, instructions) to edit,
 * sliding in from the right over the conversation, for super admins and
 * admins. The avatar and the name beside it open it, and so does a swipe from
 * the right on a phone (`BotPanelOpenEvent`, sent by the layout, so a page
 * without a conversation has nobody listening). The instructions load when
 * it opens, and Escape, the backdrop or the X closes it.
 */
export default function BotPanel({ bot, open, on_open, on_close }: Props) {
    const { pageProps } = useContext(AppContext);
    const name = bot.name || "This bot";
    const can_edit = canManageCrew({ user_types: pageProps?.user_types });
    const { system_prompt, error } = useBotInstructions({
        bot_id: Number(bot.id) || 0,
        enabled: open && can_edit,
    });

    useTopModalEscape({ onClose: on_close, enabled: open });

    useEffect(() => {
        if (!can_edit) return;

        const openPanel = () => on_open();

        window.addEventListener(BotPanelOpenEvent, openPanel);
        return () => window.removeEventListener(BotPanelOpenEvent, openPanel);
    }, [can_edit, on_open]);

    /**
     * A swipe from the right is a request for the panel, but a bot that
     * cannot be edited keeps the avatar plain: a slide-over holding nothing
     * would be worse than nothing happening.
     */
    if (!can_edit) {
        return <BotPanelTrigger bot={bot} on_open={() => {}} />;
    }

    return (
        <>
            <BotPanelTrigger bot={bot} on_open={on_open} />
            <SidePanel
                side="right"
                open={open}
                onClose={on_close}
                label={`Edit ${name}`}
                className="w-[420px] max-w-[92vw]"
            >
                <Row className="shrink-0 gap-3! flex-nowrap items-center px-4 py-3 border-0 border-b border-solid border-hairline">
                    <Stack className="shrink-0">
                        <BotAvatar
                            image_media_id={bot.image_media_id}
                            {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                            face={(bot.face || "idle") as BotFace}
                            size={35}
                        />
                    </Stack>
                    <H2 className="min-w-0 grow text-lg! leading-6! tracking-normal! font-bold text-ink truncate">
                        {`Edit ${name}`}
                    </H2>
                    <Button
                        title="Close"
                        type="button"
                        variant="ghost"
                        color="text"
                        aria-label="Close"
                        onClick={on_close}
                        className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
                    >
                        <X size={18} aria-hidden />
                    </Button>
                </Row>
                <Stack className="grow min-h-0 overflow-y-auto gap-1! items-stretch px-4 pt-4 pb-6">
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {bot.kind == "coordinator"
                            ? "The coordinator keeps its name. Give it a picture, or change its core instructions."
                            : `${name}'s core instructions apply everywhere. What it does in one workspace is under Instructions here in the menu of its conversation there.`}
                    </Span>
                    {!open ? null : system_prompt != undefined ? (
                        <BotForm
                            bot={{ ...bot, system_prompt }}
                            onCancel={on_close}
                        />
                    ) : error ? (
                        <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                            {error}
                        </Span>
                    ) : (
                        <Stack className="w-full py-10 items-center">
                            <Loading />
                        </Stack>
                    )}
                </Stack>
            </SidePanel>
        </>
    );
}