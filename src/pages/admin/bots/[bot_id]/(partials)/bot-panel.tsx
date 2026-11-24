"use client";

import { useContext, useEffect, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Loading from "@moduletrace/twui/elements/Loading";
import { X } from "lucide-react";
import SidePanel from "@/src/components/general/side-panel";
import BotAvatar from "@/src/components/general/bot-avatar";
import TabButton from "@/src/components/general/tab-button";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import { BotPanelOpenEvent } from "@/src/utils/bot-panel-open-event";
import type { BotWithLastMessage } from "@/src/types";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import BotForm from "@/src/layouts/bots/(partials)/bot-form";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import useTopModalEscape from "@/src/hooks/use-top-modal-escape";
import useBotInstructions from "../(hooks)/use-bot-instructions";
import useWorkspaceBotInstructions from "../(hooks)/use-workspace-bot-instructions";
import BotMemoryForm from "./bot-memory-form";
import BotPanelTrigger from "./bot-panel-trigger";
import BotToolsTab from "./bot-tools-tab";
import BotUserMemory from "./bot-user-memory";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in, so its memory and instructions
     * there are edited too.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * The header owns it, since the avatar and the name both open the panel.
     */
    open: boolean;
    on_open: () => void;
    on_close: () => void;
};

type PanelTab = "settings" | "tools";

/**
 * The bot's profile (picture, name, job, colour, instructions), what it keeps
 * in mind and what it works with (computer, tools, knowledgebases) to edit,
 * sliding in from the right over the conversation, for super admins and
 * admins. The avatar and the name beside it open it, and so does a swipe from
 * the right on a phone (`BotPanelOpenEvent`, sent by the layout, so a page
 * without a conversation has nobody listening). The tab's data loads when it
 * opens, and Escape, the backdrop or the X closes it.
 */
export default function BotPanel({ bot, workspace, open, on_open, on_close }: Props) {
    const { pageProps } = useContext(AppContext);
    const name = bot.name || "This bot";
    const can_edit = canManageCrew({ user_types: pageProps?.user_types });
    const [tab, setTab] = useState<PanelTab>("settings");
    const workspace_id = Number(workspace?.id) || 0;
    const { system_prompt, memory, user_memory, error } = useBotInstructions({
        bot_id: Number(bot.id) || 0,
        enabled: open && can_edit,
    });
    const workspace_instructions = useWorkspaceBotInstructions({
        workspace_id,
        bot_id: Number(bot.id) || 0,
        enabled: open && can_edit && Boolean(workspace_id) && tab == "settings",
    });
    const memory_ready =
        system_prompt != undefined &&
        memory != undefined &&
        user_memory != undefined &&
        (!workspace_id || Boolean(workspace_instructions.instructions));
    const loaded_error = error || workspace_instructions.error;

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
                <Row
                    role="tablist"
                    aria-label={`Edit ${name}`}
                    className="shrink-0 gap-1! flex-nowrap items-center px-3 py-2 border-0 border-b border-solid border-hairline"
                >
                    <TabButton title="Settings" active={tab == "settings"} onPick={() => setTab("settings")} />
                    <TabButton title="Tools" active={tab == "tools"} onPick={() => setTab("tools")} />
                </Row>
                <Stack className="grow min-h-0 overflow-y-auto gap-4! items-stretch px-4 pt-4 pb-6 [&>*]:shrink-0">
                    {open && tab == "settings" ? (
                        <>
                            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                                {bot.kind == "coordinator"
                                    ? "The coordinator keeps its name. Give it a picture, or change its core instructions."
                                    : `${name}'s core instructions apply everywhere. What it does in one workspace is under Instructions here in the menu of its conversation there.`}
                            </Span>
                            {system_prompt != undefined ? (
                                <>
                                    <BotForm
                                        bot={{ ...bot, system_prompt }}
                                        onCancel={on_close}
                                    />
                                    <Divider className="my-2 border-hairline dark:border-hairline" />
                                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                                        {`What ${name} keeps in mind, and can add to itself as it works.`}
                                    </Span>
                                    {memory_ready ? (
                                        <>
                                            <BotMemoryForm
                                                bot_id={Number(bot.id) || 0}
                                                bot_name={name}
                                                memory={memory || ""}
                                                workspace_id={workspace_id || undefined}
                                                workspace_name={workspace?.name}
                                                workspace_memory={workspace_instructions.instructions?.memory || ""}
                                                onCancel={on_close}
                                            />
                                            <Divider className="my-2 border-hairline dark:border-hairline" />
                                            <BotUserMemory bot_name={name} memory={user_memory || ""} />
                                        </>
                                    ) : loaded_error ? (
                                        <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                                            {loaded_error}
                                        </Span>
                                    ) : (
                                        <Stack className="w-full py-10 items-center">
                                            <Loading />
                                        </Stack>
                                    )}
                                </>
                            ) : error ? (
                                <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                                    {error}
                                </Span>
                            ) : (
                                <Stack className="w-full py-10 items-center">
                                    <Loading />
                                </Stack>
                            )}
                        </>
                    ) : null}
                    {open && tab == "tools" ? (
                        <BotToolsTab
                            bot={bot}
                            workspace_id={workspace_id || null}
                            initial={pageProps?.bot_extensions}
                            has_browsers={Boolean(pageProps?.has_browsers)}
                            open={open && tab == "tools"}
                        />
                    ) : null}
                </Stack>
            </SidePanel>
        </>
    );
}