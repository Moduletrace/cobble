import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import BotAvatar from "@/src/components/general/bot-avatar";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { ComposerMentionItem } from "../(utils)/search-mention-items";

type Props = {
    item: ComposerMentionItem;
    active: boolean;
    onPick: (item: ComposerMentionItem) => void;
};

/**
 * One bot or workspace in the mention menu, with its role or description.
 */
export default function ComposerMentionOption({ item, active, onPick }: Props) {
    const { bot, workspace } = item;
    const detail = bot?.role || workspace?.description || "";

    return (
        <Button
            type="button"
            variant="ghost"
            color="text"
            role="option"
            aria-selected={active}
            title={item.label}
            onMouseDown={(e) => {
                e.preventDefault();
                onPick(item);
            }}
            className={`w-full justify-start! gap-2.5! px-2! py-1.5! rounded-default-sm text-left text-ink ${active ? "bg-sunken" : "hover:bg-sunken"}`}
        >
            {bot ? (
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={(bot.face || "idle") as BotFace}
                    label={bot.name || ""}
                    size={22}
                />
            ) : null}
            {workspace ? <WorkspaceAvatar image_media_id={workspace.image_media_id} size="xs" /> : null}
            <Span className="shrink-0 text-sm font-bold leading-5">{item.label}</Span>
            {detail ? (
                <Span className="min-w-0 truncate text-xs leading-4 text-ink-secondary">{detail}</Span>
            ) : null}
        </Button>
    );
}
