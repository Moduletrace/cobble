import { useContext } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import Span from "@moduletrace/twui/layout/Span";
import BotAvatar from "@/src/components/general/bot-avatar";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import { CrewBotsContext } from "../(data)/crew-bots-context";
import { CrewWorkspacesContext } from "../(data)/crew-workspaces-context";

/**
 * A bot or workspace mentioned in the composer, shown like the chips in
 * the thread (`BotRefChip`, `WorkspaceRefChip`) but not a link. One the
 * user can't see any more keeps its ref's words.
 */
export default function ComposerMentionChip({ node, selected }: ReactNodeViewProps) {
    const bots = useContext(CrewBotsContext);
    const workspaces = useContext(CrewWorkspacesContext);
    const id = Number(node.attrs.id);
    const is_workspace = node.attrs.mentionSuggestionChar == "#";
    const bot = is_workspace ? undefined : bots.find((b) => b.id == id);
    const workspace = is_workspace ? workspaces.find((w) => w.id == id) : undefined;
    const name = bot?.name || workspace?.name || node.attrs.label || `${is_workspace ? "workspace" : "bot"} ${id}`;

    return (
        <NodeViewWrapper
            as="span"
            data-mention=""
            className={`inline-flex h-6 gap-1.5 items-center px-1.5 mx-px align-middle rounded-default-xs bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap ${selected ? "ring-2 ring-ink" : ""}`}
        >
            {bot ? (
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={(bot.face || "idle") as BotFace}
                    label={bot.name || ""}
                    size={18}
                />
            ) : null}
            {workspace ? <WorkspaceAvatar image_media_id={workspace.image_media_id} size="xs" /> : null}
            <Span>{name}</Span>
        </NodeViewWrapper>
    );
}
