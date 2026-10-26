import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import useExtensions from "@/src/hooks/use-extensions";
import type { BotExtensionsPayload, BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import { composerKnowledgebasesCopy, composerToolsCopy } from "../(data)/composer-extensions-copy";
import ComposerComputerButton from "./composer-computer-button";
import ComposerToolsModal from "./composer-tools-modal";
import { Dot } from "lucide-react";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
    initial?: BotExtensionsPayload | null;
};

/**
 * Under the composer: one button counting the MCP servers, tools and
 * skills the bot can use here, one beside it counting the knowledgebases it
 * searches (each opens in a modal, so ten of them don't fill the
 * composer), then the computer it's on, opening it in the viewer.
 */
export default function ComposerTools({ bot, workspace_id, initial }: Props) {
    const bot_name = bot.name || "this bot";
    const extensions = useExtensions({
        owner: { bot_id: bot.id || 0, workspace_id },
        owner_name: bot_name,
        initial,
    });

    const { computers } = useContext(BotComputersContext);

    const is_knowledge = (item: { kind: string }) => item.kind == "knowledgebase";
    const tools = {
        attached: extensions.attached.filter((item) => !is_knowledge(item)),
        addable: extensions.addable.filter((item) => !is_knowledge(item)),
    };
    const knowledge = {
        attached: extensions.attached.filter(is_knowledge),
        addable: extensions.addable.filter(is_knowledge),
    };

    const has_tools = Boolean(tools.attached.length || (extensions.can_manage && tools.addable.length));
    const has_knowledge = Boolean(knowledge.attached.length || (extensions.can_manage && knowledge.addable.length));

    if (!has_tools && !has_knowledge && !computers.length) return null;

    return (
        <Row className="w-full max-w-container mx-auto gap-1.5! items-center px-3 md:px-6 pb-3 -mt-3">
            {has_tools ? (
                <ComposerToolsModal
                    bot_name={bot_name}
                    copy={composerToolsCopy({ bot_name })}
                    attached={tools.attached}
                    addable={tools.addable}
                    can_manage={extensions.can_manage}
                    busy={extensions.busy}
                    onAdd={extensions.add}
                    onRemove={extensions.remove}
                />
            ) : null}

            {has_knowledge ? (
                <ComposerToolsModal
                    bot_name={bot_name}
                    copy={composerKnowledgebasesCopy({ bot_name })}
                    attached={knowledge.attached}
                    addable={knowledge.addable}
                    can_manage={extensions.can_manage}
                    busy={extensions.busy}
                    onAdd={extensions.add}
                    onRemove={extensions.remove}
                />
            ) : null}

            {(has_tools || has_knowledge) && computers.length ? (
                <Span className="-mr-2 opacity-40">
                    <Dot size={20} />
                </Span>
            ) : null}

            <ComposerComputerButton />

            {extensions.status?.error ? (
                <Span
                    role="alert"
                    className="text-[12px] leading-4 text-ink-secondary"
                >
                    {extensions.status.msg}
                </Span>
            ) : null}
        </Row>
    );
}
