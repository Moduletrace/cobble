import Stack from "@moduletrace/twui/layout/Stack";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessage from "./user-message";
import GroupTimestamp from "./group-timestamp";

/**
 * Right-aligned ink bubbles (each message's files above it), one
 * timestamp under the group.
 */
export default function UserMessageGroup({ group }: { group: MessageGroup }) {
    return (
        <Stack className="w-full gap-1! items-end">
            {group.messages.map((message) => (
                <UserMessage key={message.id} {...message} />
            ))}
            <GroupTimestamp at={group.at} />
        </Stack>
    );
}
