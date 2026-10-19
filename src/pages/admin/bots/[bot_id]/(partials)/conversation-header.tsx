import { useContext, useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import { CpuAi, Layers, Monitor } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import BotComputersModal from "./bot-computers-modal";
import BotModelsModal from "./bot-models-modal";
import BotProfileModal from "./bot-profile-modal";
import BotSessionsModal from "./bot-sessions-modal";
import NewSessionButton from "./new-session-button";
import HeaderMetaItem from "./header-meta-item";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in: its name shows under the
     * bot's, and the models modal edits its models.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    has_other_unread?: boolean;
    /**
     * The bot's models (the defaults for the coordinator).
     */
    harnesses?: HarnessOverview[] | null;
};

/**
 * 64px header. Under the name, what the bot runs on: its text model and
 * provider, and the computer it's on. On the right, ghost icon buttons
 * that open the computers and models modals. Kept here so a save or a
 * switch shows under the name at once.
 */
export default function ConversationHeader({ bot, workspace, has_other_unread, harnesses: initial }: Props) {
    const [harnesses, setHarnesses] = useState(initial);
    const { computers } = useContext(BotComputersContext);

    const model = harnesses?.find((h) => h.harness == "text")?.current;
    const computer = computers[0];

    return (
        <Row className="h-16 shrink-0 gap-3! flex-nowrap items-center px-6 border-0 border-b border-solid border-hairline">
            <BotProfileModal bot={bot} />
            <Stack className="min-w-0 gap-0!">
                <H1 className="text-lg! leading-6! tracking-normal! font-bold text-ink truncate w-full">
                    {bot.name}
                </H1>
                <Row className="min-w-0 w-full gap-x-3! gap-y-0! flex-nowrap">
                    {workspace?.id ? (
                        <HeaderMetaItem icon={Layers} label="Workspace" text={workspace.name || "Workspace"} />
                    ) : null}
                    <HeaderMetaItem
                        icon={CpuAi}
                        label="Model"
                        text={
                            model
                                ? `${model.name} · ${model.provider_name}`
                                : "No model set up"
                        }
                    />
                    {computer?.id ? (
                        <HeaderMetaItem
                            icon={Monitor}
                            label="Computer"
                            text={computer.name || `Computer ${computer.id}`}
                        />
                    ) : null}
                </Row>
            </Stack>
            <Row className="ml-auto shrink-0 gap-1! flex-nowrap justify-end">
                <BotSessionsModal
                    bot={bot}
                    workspace_id={workspace?.id || null}
                    has_other_unread={has_other_unread}
                />
                <NewSessionButton bot_id={Number(bot.id)} workspace_id={workspace?.id || null} />
                <BotComputersModal bot={bot} workspace_name={workspace?.id ? workspace.name || "This workspace" : null} />
                <BotModelsModal
                    key={bot.id}
                    bot={bot}
                    workspace={workspace}
                    harnesses={harnesses}
                    onSaved={setHarnesses}
                />
            </Row>
        </Row>
    );
}
