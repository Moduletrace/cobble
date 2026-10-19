import { sendToUser } from "@/src/websocket/(functions)/send-to-user";
import grabUserComputers from "./grab-user-computers";

type Params = {
    computer_id: number | string;
};

/**
 * Pushes a computer's current state (`server:computer-updated`) to its
 * owner's open tabs. Best effort.
 */
export default async function pushComputerUpdate({ computer_id }: Params) {
    const computer = (await grabUserComputers({ computer_id }))[0];

    if (!computer?.user_id) return;

    sendToUser({
        user_id: computer.user_id,
        data: { event: "server:computer-updated", data: computer },
    });
}
