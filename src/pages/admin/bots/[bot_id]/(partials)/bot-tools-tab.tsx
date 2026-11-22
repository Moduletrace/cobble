import { useContext } from "react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import useExtensions from "@/src/hooks/use-extensions";
import type {
    BotExtensionsPayload,
    BotWithLastMessage,
} from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import {
    composerKnowledgebasesCopy,
    composerToolsCopy,
} from "../(data)/composer-extensions-copy";
import BotComputerOption from "./bot-computer-option";
import BotPanelSection from "./bot-panel-section";
import ComposerBrowserButton from "./composer-browser-button";
import ComposerConnectorsSection from "./composer-connectors-section";
import ComposerExtensionsList from "./composer-extensions-list";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
    initial?: BotExtensionsPayload | null;
    /**
     * Whether the user has a browser of their own; without one there is
     * nothing to pick.
     */
    has_browsers?: boolean;
    /**
     * Whether the tab is on show, so its connectors are read then and its
     * computer switches show.
     */
    open: boolean;
};

/**
 * The bot panel's third tab: where it works and what it can use there - its
 * computer, the MCP servers, tools and skills it was given (the apps its
 * connectors reach for you among them), its knowledgebases, and which of
 * your browsers it acts as you in.
 */
export default function BotToolsTab({ bot, workspace_id, initial, has_browsers, open }: Props) {
    const bot_name = bot.name || "this bot";
    const extensions = useExtensions({
        owner: { bot_id: bot.id || 0, workspace_id },
        owner_name: bot_name,
        initial,
    });
    const { computers, switching_id, error: computer_error, switchComputer, openComputer } =
        useContext(BotComputersContext);

    const is_knowledge = (item: { kind: string }) => item.kind == "knowledgebase";
    const tools = {
        attached: extensions.attached.filter((item) => !is_knowledge(item)),
        addable: extensions.addable.filter((item) => !is_knowledge(item)),
    };
    const knowledge = {
        attached: extensions.attached.filter(is_knowledge),
        addable: extensions.addable.filter(is_knowledge),
    };
    const tools_copy = composerToolsCopy({ bot_name });
    const knowledge_copy = composerKnowledgebasesCopy({ bot_name });

    return (
        <Stack className="w-full gap-4! items-stretch">
            <BotPanelSection
                title="Computer"
                description={`A computer is a sandbox ${bot_name} works in: a shell, a browser and files of its own. Its tasks run on the checked one. Open one to use it yourself.`}
            >
                {computers.length ? (
                    <Stack
                        role="radiogroup"
                        aria-label={`${bot_name}'s computers`}
                        className="w-full mt-2 py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface"
                    >
                        {computers.map((computer, index) => (
                            <BotComputerOption
                                key={computer.id}
                                computer={computer}
                                current={index == 0}
                                onPick={async () => {
                                    await switchComputer({ computer_id: computer.id || 0 });
                                }}
                                onOpen={() => {
                                    openComputer({ computer_id: computer.id || 0 });
                                }}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Span className="mt-2 text-[13px] leading-[18px] text-ink-secondary">
                        {`No computer is set up for ${bot_name} yet.`}
                    </Span>
                )}
                {switching_id ? (
                    <Span className="mt-2 text-[13px] leading-[18px] text-ink-secondary">
                        Switching its computer. The tasks it has open finish where they are.
                    </Span>
                ) : null}
                {computer_error ? (
                    <Span role="alert" className="mt-2 text-[13px] leading-[18px] text-ink-secondary">
                        {computer_error}
                    </Span>
                ) : null}
            </BotPanelSection>

            <BotPanelSection title="Tools" description={tools_copy.some}>
                <ComposerExtensionsList
                    id="panel-add-extension"
                    label={tools_copy.title}
                    items={tools.attached}
                    addable={tools.addable}
                    can_manage={extensions.can_manage}
                    busy={extensions.busy}
                    empty={tools_copy.none}
                    add_hint={tools_copy.add_hint}
                    add_noun={tools_copy.add_noun}
                    onAdd={extensions.add}
                    onRemove={extensions.remove}
                />
                <ComposerConnectorsSection
                    bot_id={bot.id || 0}
                    workspace_id={workspace_id}
                    open={open}
                />
                {has_browsers ? (
                    <Stack className="w-full mt-4 gap-2! items-start">
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {`Which of your browsers ${bot_name} acts as you in.`}
                        </Span>
                        <ComposerBrowserButton
                            bot_id={bot.id || 0}
                            bot_name={bot_name}
                            workspace_id={workspace_id}
                        />
                    </Stack>
                ) : null}
            </BotPanelSection>

            <BotPanelSection title="Knowledgebases" description={knowledge_copy.some}>
                <ComposerExtensionsList
                    id="panel-add-knowledgebase"
                    label={knowledge_copy.title}
                    items={knowledge.attached}
                    addable={knowledge.addable}
                    can_manage={extensions.can_manage}
                    busy={extensions.busy}
                    empty={knowledge_copy.none}
                    add_hint={knowledge_copy.add_hint}
                    add_noun={knowledge_copy.add_noun}
                    onAdd={extensions.add}
                    onRemove={extensions.remove}
                />
            </BotPanelSection>

            {extensions.status?.error ? (
                <Span role="alert" className="text-[13px] leading-[18px] text-ink-secondary">
                    {extensions.status.msg}
                </Span>
            ) : null}
        </Stack>
    );
}