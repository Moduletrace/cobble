import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import useExtensions from "@/src/hooks/use-extensions";
import type { BotExtensionsPayload, BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import ComposerAddToolModal from "./composer-add-tool-modal";
import ComposerComputerButton from "./composer-computer-button";
import ComposerToolChip from "./composer-tool-chip";
import { Dot } from "lucide-react";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
    initial?: BotExtensionsPayload | null;
};

/**
 * The MCP servers and tools the bot can use here, under the composer.
 * Super admins and admins remove any it was given (even one every bot
 * started with) and add more; a workspace's own stay. The computer the
 * bot is on sits before them, opening it in the viewer.
 */
export default function ComposerTools({ bot, workspace_id, initial }: Props) {
    const extensions = useExtensions({
        owner: { bot_id: bot.id || 0, workspace_id },
        owner_name: bot.name || "this bot",
        initial,
    });

    const { computers } = useContext(BotComputersContext);

    const has_tools = Boolean(
        extensions.attached.length ||
        (extensions.can_manage && extensions.addable.length),
    );

    if (!has_tools && !computers.length) return null;

    return (
        <Row className="w-full max-w-container mx-auto gap-1.5! items-center px-6 pb-3 -mt-3">
            {has_tools ? (
                <Span className="text-[12px] leading-4 text-ink-secondary">
                    Tools
                </Span>
            ) : null}
            {extensions.attached.map((item) => (
                <ComposerToolChip
                    key={`${item.kind}:${item.id}`}
                    item={item}
                    busy={extensions.busy == `${item.kind}:${item.id}`}
                    onRemove={
                        extensions.can_manage && item.source == "bot"
                            ? () =>
                                  extensions.remove({
                                      kind: item.kind,
                                      id: item.id,
                                      name: item.name,
                                  })
                            : undefined
                    }
                />
            ))}

            {extensions.can_manage ? (
                <ComposerAddToolModal
                    bot_name={bot.name || "This bot"}
                    addable={extensions.addable}
                    loading={Boolean(extensions.busy)}
                    onAdd={extensions.add}
                />
            ) : null}

            {has_tools ? (
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
