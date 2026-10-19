import { sendToUser } from "@/src/websocket/(functions)/send-to-user";
import grabComputerAudience from "../access/grab-computer-audience";
import grabUserComputers from "./grab-user-computers";

type Params = {
    computer_id: number | string;
};

/**
 * Pushes a computer's current state (`server:computer-updated`) to the
 * open tabs of everyone who sees it (`grabComputerAudience`). Best effort.
 */
export default async function pushComputerUpdate({ computer_id }: Params) {
    const computer = (await grabUserComputers({ computer_id }))[0];

    if (!computer?.id) return;

    for (const user_id of await grabComputerAudience({ computer_id: computer.id })) {
        sendToUser({ user_id, data: { event: "server:computer-updated", data: computer } });
    }
}
