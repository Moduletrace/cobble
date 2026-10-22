import { useContext, useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { CpuAi, EllipsisVertical, Monitor } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import RailDrawerButton from "@/src/layouts/bots/(partials)/rail-drawer-button";
import { BotComputersContext } from "../(data)/bot-computers-context";
import BotProfileModal from "./bot-profile-modal";
import ConversationHeaderMenu from "./conversation-header-menu";
import HeaderMetaItem from "./header-meta-item";
import BackButton from "@/src/components/general/back-button";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in: its name shows under the
     * bot's, and the models modal edits its models.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    has_other_unread?: boolean;
};

/**
 * 64px header. Under the name, what the bot runs on: its model and the
 * computer it's on. On the right, one menu holding everything the header
 * used to show as icons: sessions, a new session, the computer, the models
 * and the bot's settings. Kept here so a save or a switch shows under the
 * name at once.
 */
export default function ConversationHeader({
    bot,
    workspace,
    has_other_unread,
}: Props) {
    const { computers } = useContext(BotComputersContext);
    const { pageProps } = useContext(AppContext);
    const [model, setModel] = useState(pageProps?.bot_text_model);
    const { open: open_menu, setOpen: set_open_menu } = useStatus();
    const computer = computers[0];
    const computer_name = computer?.id
        ? computer.name || `Computer ${computer.id}`
        : null;

    const is_workspace = pageProps?.url?.pathname.includes(`/workspaces/`);

    return (
        <Row className="h-16 shrink-0 gap-2! md:gap-3! flex-nowrap items-center px-3 md:px-6 border-0 border-b border-solid border-hairline">
            <RailDrawerButton />
            {is_workspace ? <BackButton /> : null}
            <BotProfileModal bot={bot} />
            <Stack className="min-w-0 gap-0!">
                <H1 className="text-lg! leading-6! tracking-normal! font-bold text-ink truncate w-full line-clamp-1">
                    {bot.name}
                </H1>

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
                        <HeaderMetaItem
                            icon={CpuAi}
                            label="Model"
                            text={
                                model
                                    ? `${model.name} · ${model.provider_name}`
                                    : "No model set up"
                            }
                        />
                        {computer_name ? (
                            <HeaderMetaItem
                                icon={Monitor}
                                label="Computer"
                                text={computer_name}
                            />
                        ) : null}
                    </Row>
                </Row>
            </Stack>

            <Row className="ml-auto shrink-0 flex-nowrap justify-end">
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
                        on_model_saved={(harnesses) => {
                            const current = harnesses.find(
                                (h) => h.harness == "text",
                            )?.current;

                            setModel(
                                current
                                    ? {
                                          name: current.name,
                                          provider_name: current.provider_name,
                                      }
                                    : null,
                            );
                        }}
                        on_open={() => set_open_menu(false)}
                    />
                </Dropdown>
            </Row>
        </Row>
    );
}
