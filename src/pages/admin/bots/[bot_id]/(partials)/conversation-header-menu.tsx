import { useContext } from "react";
import Paper from "@moduletrace/twui/elements/Paper";
import Stack from "@moduletrace/twui/layout/Stack";
import Divider from "@moduletrace/twui/layout/Divider";
import { History, Settings } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import BotSessionsModal from "@/src/components/general/bot-sessions-modal";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import BotComputersModal from "./bot-computers-modal";
import BotModelsModal from "./bot-models-modal";
import HeaderMenuItem from "./header-menu-item";
import NewSessionButton from "./new-session-button";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in: its name shows under the
     * bot's, and the models modal edits its models.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * A bot message arrived in another session of this conversation.
     */
    has_other_unread?: boolean;
    /**
     * The computer the bot is on, shown on its row.
     */
    computer_name?: string | null;
    /**
     * The text model the bot runs on, shown on its row.
     */
    model_name?: string | null;
    /**
     * After the models modal saved, so the header shows the new model.
     */
    on_model_saved: (harnesses: HarnessOverview[]) => void;
    /**
     * A row is opening something: the menu closes, leaving only that.
     */
    on_open: () => void;
};

/**
 * The conversation header's menu: the sessions, a new session, the bot's
 * computer, its models and its settings. A row that opens a modal closes
 * the menu first, so the modal never sits behind an open menu.
 */
export default function ConversationHeaderMenu({
    bot,
    workspace,
    has_other_unread,
    computer_name,
    model_name,
    on_model_saved,
    on_open,
}: Props) {
    const { pageProps } = useContext(AppContext);
    const can_open_settings =
        bot.kind == "coordinator"
            ? isPassThroughUser({ user_types: pageProps?.user_types })
            : canManageCrew({ user_types: pageProps?.user_types });

    return (
        <Paper
            role="menu"
            className="min-w-[220px] p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
        >
            <Stack className="w-full gap-0! items-stretch">
                <BotSessionsModal
                    bot={bot}
                    workspace_id={workspace?.id || null}
                    has_other_unread={has_other_unread}
                    target={
                        <HeaderMenuItem
                            icon={History}
                            title="Chat sessions"
                            hint={has_other_unread ? "New" : undefined}
                            description={
                                has_other_unread
                                    ? "Sessions: new messages in another session"
                                    : "Sessions"
                            }
                        />
                    }
                    target_wrapper_props={{ className: "w-full" }}
                    on_open={on_open}
                />
                <NewSessionButton
                    menu
                    bot_id={Number(bot.id)}
                    workspace_id={workspace?.id || null}
                    on_open={on_open}
                />
                <BotComputersModal
                    menu
                    bot={bot}
                    workspace_name={
                        workspace?.id
                            ? workspace.name || "This workspace"
                            : null
                    }
                    menu_hint={computer_name}
                    on_open={on_open}
                />
                <BotModelsModal
                    key={bot.id}
                    menu
                    bot={bot}
                    workspace={workspace}
                    menu_hint={model_name}
                    on_open={on_open}
                    onSaved={on_model_saved}
                />
            </Stack>
            {can_open_settings ? (
                <>
                    <Divider className="my-1 mx-3 w-auto border-hairline dark:border-hairline" />
                    <HeaderMenuItem
                        icon={Settings}
                        title="Settings"
                        description={`${bot.name || "This bot"}'s settings`}
                        href={`/admin/settings/bots/${bot.id}`}
                    />
                </>
            ) : null}
        </Paper>
    );
}
