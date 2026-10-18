import Stack from "@moduletrace/twui/layout/Stack";
import type { MessageGroup } from "../(utils)/group-messages";
import UserBubble from "./user-bubble";
import GroupTimestamp from "./group-timestamp";

/**
 * Right-aligned ink bubbles, one timestamp under the group.
 */
export default function UserMessageGroup({ group }: { group: MessageGroup }) {
    return (
        <Stack className="w-full gap-1! items-end">
            {group.messages.map((message) => (
                <UserBubble key={message.id} text={message.text || ""} />
            ))}
            <GroupTimestamp at={group.at} />
        </Stack>
    );
}
