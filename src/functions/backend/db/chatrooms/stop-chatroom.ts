import AppError from "@/src/utils/app-error";
import closeChatroom from "./close-chatroom";
import grabChatroom from "./grab-chatroom";

type Params = {
    chatroom_id: number | string;
    user_id: number | string;
};

/**
 * The room's user stops it: everything in it that could still run is
 * cancelled and the asking bot is told, without being woken.
 */
export default async function stopChatroom({ chatroom_id, user_id }: Params) {
    const room = await grabChatroom({ chatroom_id, user_id });

    if (!room?.id) {
        throw new AppError(`Chatroom not found.`);
    }

    if (room.status != "open") return false;

    return await closeChatroom({ chatroom_id: room.id, status: "stopped", outcome: "" });
}
