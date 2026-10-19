import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotUpdatedData } from "@/src/types";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { ComputerViewMode } from "@/src/dict/computer-dict";
import setBotComputer from "../(functions)/set-bot-computer";

/**
 * The computer open in the viewer, in which mode, and whether the bot
 * asked the user to take it over (the viewer then offers to hand it back).
 */
export type ComputerViewing = {
    computer_id: number;
    mode: ComputerViewMode;
    take_over?: boolean;
};

export type BotComputers = {
    /**
     * The bot's computers, the one it's on first.
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The computer being switched to, while the switch runs.
     */
    switching_id?: number;
    error?: string;
    switchComputer: (params: { computer_id: number }) => Promise<void>;
    viewing?: ComputerViewing;
    openComputer: (params: ComputerViewing) => void;
    closeComputer: () => void;
};

type Params = {
    bot_id: number;
    /**
     * In a workspace, switching changes the workspace's default computer.
     */
    workspace_id?: number | null;
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
};

/**
 * Keeps the open bot's computers and switches the one it's on, in place:
 * no reload, the list comes back reordered. A switch made in another tab
 * arrives as `server:bot-updated` with the bot's `computer_id`. Also holds
 * the computer open in the viewer (`ComputerViewerModal`).
 */
export default function useBotComputers({ bot_id, workspace_id, computers: initial }: Params): BotComputers {
    const [computers, setComputers] = useState(initial);
    const [switching_id, setSwitchingId] = useState<number>();
    const [error, setError] = useState<string>();
    const [viewing, setViewing] = useState<ComputerViewing>();

    useServerEvent({
        event: "server:bot-updated",
        onData: (data: BotUpdatedData) => {
            const computer_id = data.computer_id;

            if (data.id != bot_id || !computer_id) return;

            setComputers((prev) => {
                const picked = prev.find((c) => c.id == computer_id);

                return !picked || prev[0]?.id == computer_id
                    ? prev
                    : [picked, ...prev.filter((c) => c.id != computer_id)];
            });
        },
    });

    const switchComputer = async ({ computer_id }: { computer_id: number }) => {
        if (switching_id || computers[0]?.id == computer_id) return;

        setSwitchingId(computer_id);
        setError(undefined);

        const res = await setBotComputer({ bot_id, computer_id, workspace_id }).catch(() => null);

        if (res?.success && res.payload?.length) {
            setComputers(res.payload);
        } else {
            setError(res?.msg || "Couldn't switch computers");
        }

        setSwitchingId(undefined);
    };

    return {
        computers,
        switching_id,
        error,
        switchComputer,
        viewing,
        openComputer: (params) => setViewing(params),
        closeComputer: () => setViewing(undefined),
    };
}
