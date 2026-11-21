import { useCallback, useContext, useEffect, useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Tag from "@moduletrace/twui/elements/Tag";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { EllipsisVertical } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type {
    BotTextModel,
    BotWithLastMessage,
    HarnessOverview,
} from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import RailDrawerButton from "@/src/layouts/bots/(partials)/rail-drawer-button";
import { BotComputersContext } from "../(data)/bot-computers-context";
import BotPanel from "./bot-panel";
import BotPanelName from "./bot-panel-name";
import BotModelsModal from "./bot-models-modal";
import BotComputersModal from "./bot-computers-modal";
import ConversationHeaderMenu from "./conversation-header-menu";
import BackButton from "@/src/components/general/back-button";
import AdminShield from "@/src/components/general/admin-shield";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in: its name shows under the
     * bot's, and the models modal edits its models.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    has_other_unread?: boolean;
    /**
     * The text model the bot runs on, kept by the conversation (which
     * shows a notice while there's none).
     */
    model?: BotTextModel | null;
    onModelChange: (model: BotTextModel | null) => void;
    /**
     * Whether the composer's Plan mode is on: the name wears a tag, since
     * the mode decides what every reply may touch.
     */
    plan_mode?: boolean;
};

/**
 * 64px header. Under the name, what the bot runs on: its model and the
 * computer it's on. On the right, one menu
 * holding everything the header used to show as icons: sessions, a new
 * session, the computer, the models and the bot's settings. Kept here so a
 * save or a switch shows under the name at once. The avatar and the name both
 * open the bot's panel, slid in over the conversation.
 */
export default function ConversationHeader({
    bot,
    workspace,
    has_other_unread,
    model,
    onModelChange,
    plan_mode,
}: Props) {
    const { computers } = useContext(BotComputersContext);
    const { pageProps } = useContext(AppContext);
    /**
     * The menu's toggle shows its change at once; a push (here or from
     * another tab) brings the live bot's.
     */
    const [is_admin, setIsAdmin] = useState(Boolean(bot.is_admin));

    useEffect(() => {
        setIsAdmin(Boolean(bot.is_admin));
    }, [bot.is_admin]);
    const { open: open_menu, setOpen: set_open_menu } = useStatus();
    /**
     * The bot's panel, slid in from the right: its avatar, its name or a
     * swipe bring it.
     */
    const [bot_panel_open, set_bot_panel_open] = useState(false);
    const open_bot_panel = useCallback(() => set_bot_panel_open(true), []);
    const close_bot_panel = useCallback(() => set_bot_panel_open(false), []);
    const computer = computers[0];
    const computer_name = computer?.id
        ? computer.name || `Computer ${computer.id}`
        : null;

    const is_workspace = pageProps?.url?.pathname.includes(`/workspaces/`);

    /**
     * A save from either models modal (the model line or the menu's row)
     * shows under the name at once.
     */
    function handleModelSaved(harnesses: HarnessOverview[]) {
        const current = harnesses.find((h) => h.harness == "text")?.current;

        onModelChange(
            current
                ? { name: current.name, provider_name: current.provider_name }
                : null,
        );
    }

    return (
        <Row className="h-16 shrink-0 gap-2! md:gap-3! flex-nowrap items-center px-3 md:px-6 border-0 border-b border-solid border-hairline">
            <RailDrawerButton />
            {is_workspace ? <BackButton /> : null}
            <BotPanel
                bot={bot}
                open={bot_panel_open}
                on_open={open_bot_panel}
                on_close={close_bot_panel}
            />
            <Stack className="min-w-0 gap-0!">
                <Row className="w-full min-w-0 gap-1.5! flex-nowrap">
                    <BotPanelName bot={bot} on_open={open_bot_panel} />
                    {plan_mode ? (
                        <Tag
                            color="success"
                            title="Plan mode is on: the bot plans and reads, and changes nothing"
                            className="shrink-0"
                        >
                            Plan
                        </Tag>
                    ) : null}
                    {workspace?.id && is_admin ? (
                        <AdminShield size={16} label={`Admin of ${workspace.name || "this workspace"}`} />
                    ) : null}
                </Row>

                <Row className="flex-nowrap w-full">
                    {workspace?.id ? (
                        <Row className="min-w-0 gap-2! flex-nowrap">
                            <WorkspaceAvatar
                                image_media_id={workspace.image_media_id}
                                size="xs"
                            />
                            <Span
                                size="smaller"
                                className="truncate hidden xl:block"
                            >
                                {workspace.name || "Workspace"}
                            </Span>
                        </Row>
                    ) : null}

                    <Row className="min-w-0 gap-x-1! md:gap-x-3! gap-y-0! flex-nowrap grow">
                        <BotModelsModal
                            key={bot.id}
                            bot={bot}
                            workspace={workspace}
                            meta_text={
                                model
                                    ? `${model.name} · ${model.provider_name}`
                                    : "No model set up"
                            }
                            onSaved={handleModelSaved}
                        />
                        {computer_name ? (
                            <BotComputersModal
                                bot={bot}
                                workspace_name={
                                    workspace?.id
                                        ? workspace.name || "This workspace"
                                        : null
                                }
                                meta_text={computer_name}
                            />
                        ) : null}
                    </Row>
                </Row>
            </Stack>

            <Row className="ml-auto shrink-0 flex-nowrap items-center justify-end gap-1!">
                <Dropdown
                    position="bottom-right"
                    externalOpen={open_menu}
                    externalSetOpen={set_open_menu}
                    target={
                        <Button
                            title="Bot menu"
                            aria-label="Bot menu"
                            aria-haspopup="menu"
                            type="button"
                            variant="ghost"
                            color="text"
                            className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
                        >
                            <EllipsisVertical size={18} aria-hidden />
                        </Button>
                    }
                >
                    <ConversationHeaderMenu
                        bot={bot}
                        workspace={workspace}
                        has_other_unread={has_other_unread}
                        computer_name={computer_name}
                        model_name={model?.name}
                        on_model_saved={handleModelSaved}
                        on_open={() => set_open_menu(false)}
                        is_admin={is_admin}
                        on_admin_changed={setIsAdmin}
                    />
                </Dropdown>
            </Row>
        </Row>
    );
}
