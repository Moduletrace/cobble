import Stack from "@moduletrace/twui/layout/Stack";
import type { ChatroomSummary } from "@/src/types";
import chatroomBotStatuses from "@/src/utils/chatroom-bot-statuses";
import useChatroomSteps from "../(hooks)/use-chatroom-steps";
import ChatroomStatusRow from "../(partials)/chatroom-status-row";

type Props = {
    room: ChatroomSummary;
};

/**
 * Under the thread while the room is open: one row per bot saying where it
 * stands (waiting for the answer, thinking, working with its latest step,
 * waiting on another, done).
 */
export default function ChatroomStatus({ room }: Props) {
    const steps = useChatroomSteps({ jobs: room.jobs || [] });
    const statuses = chatroomBotStatuses({ room, steps });

    if (!statuses.length) return null;

    return (
        <Stack role="status" className="w-full gap-3! items-stretch pt-2">
            {statuses.map((status) => (
                <ChatroomStatusRow key={status.bot.id} {...status} />
            ))}
        </Stack>
    );
}
