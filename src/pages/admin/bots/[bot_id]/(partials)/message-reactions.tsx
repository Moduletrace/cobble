import Row from "@moduletrace/twui/layout/Row";
import type { BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import type { BotMessageReaction } from "@/src/types";
import MessageReactionChip from "./message-reaction-chip";

type Props = {
    message_id: number;
    reactions?: BotMessageReaction[];
    /**
     * Left out where the reactions only show (the user's own messages).
     */
    onReact?: (params: { message_id: number; emoji: BotMessageReactionEmoji }) => void;
};

/**
 * The reactions a message has, one chip per emoji, each toggleable when
 * `onReact` is given.
 */
export default function MessageReactions({ message_id, reactions, onReact }: Props) {
    if (!reactions?.length) return null;

    return (
        <Row className="gap-1.5! flex-wrap items-center">
            {reactions.map((reaction) => (
                <MessageReactionChip
                    key={reaction.emoji}
                    emoji={reaction.emoji}
                    count={reaction.count}
                    mine={reaction.mine}
                    onToggle={onReact ? () => onReact({ message_id, emoji: reaction.emoji }) : undefined}
                />
            ))}
        </Row>
    );
}
