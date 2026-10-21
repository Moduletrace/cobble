import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import useExtensions from "@/src/hooks/use-extensions";
import type { BotExtensionsPayload, BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import ComposerComputerButton from "./composer-computer-button";
import ComposerToolsModal from "./composer-tools-modal";
import { Dot } from "lucide-react";

type Props = {
    bot: BotWithLastMessage;
    workspace_id?: number | null;
    initial?: BotExtensionsPayload | null;
};

/**
 * Under the composer: one button counting the MCP servers and tools the
 * bot can use here (they open in a modal, so ten of them don't fill the
 * composer), then the computer it's on, opening it in the viewer.
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
        <Row className="w-full max-w-container mx-auto gap-1.5! items-center px-3 md:px-6 pb-3 -mt-3">
            {has_tools ? (
                <ComposerToolsModal
                    bot_name={bot.name || "this bot"}
                    attached={extensions.attached}
                    addable={extensions.addable}
                    can_manage={extensions.can_manage}
                    busy={extensions.busy}
                    onAdd={extensions.add}
                    onRemove={extensions.remove}
                />
            ) : null}

            {has_tools && computers.length ? (
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
