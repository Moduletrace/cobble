import { useState } from "react";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Row from "@moduletrace/twui/layout/Row";
import { SmilePlus } from "lucide-react";
import { BotMessageReactions, type BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import MessageActionButton from "./message-action-button";
import MessageReactionOption from "./message-reaction-option";

type Props = {
    message_id: number;
    onReact: (params: { message_id: number; emoji: BotMessageReactionEmoji }) => void;
};

/**
 * Opens the fixed set of reactions and adds one to the message. The
 * picker closes as soon as one is picked.
 */
export default function MessageReactionPicker({ message_id, onReact }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dropdown
            position="top-left"
            externalOpen={open}
            externalSetOpen={setOpen}
            contentWrapperProps={{ className: "pb-1" }}
            target={
                <MessageActionButton
                    title="Add a reaction"
                    aria_label="Add a reaction"
                    onClick={() => {}}
                >
                    <SmilePlus size={14} aria-hidden />
                </MessageActionButton>
            }
        >
            <Row className="gap-0! flex-nowrap items-center rounded-default-lg border border-solid border-hairline bg-surface p-1 shadow-popover">
                {BotMessageReactions.map((reaction) => (
                    <MessageReactionOption
                        key={reaction.value}
                        title={reaction.title}
                        value={reaction.value}
                        onPick={() => {
                            setOpen(false);
                            onReact({ message_id, emoji: reaction.value });
                        }}
                    />
                ))}
            </Row>
        </Dropdown>
    );
}
