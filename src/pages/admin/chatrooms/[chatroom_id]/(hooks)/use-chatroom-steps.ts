import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData, ChatroomJob } from "@/src/types";

type Params = {
    jobs: ChatroomJob[];
};

/**
 * The latest step of each job still open in the room, by room session, from
 * `server:bot-job-update` (tool steps only: a closing note is the message
 * itself, about to land).
 */
export default function useChatroomSteps({ jobs }: Params) {
    const [steps, setSteps] = useState<Record<number, string>>({});

    useServerEvent({
        event: "server:bot-job-update",
        onData: (update: BotJobUpdateData) => {
            if (!update.text || update.kind == "note" || !update.session_id) return;
            if (!jobs.some((job) => job.session_id == update.session_id)) return;

            setSteps((prev) => ({ ...prev, [Number(update.session_id)]: update.text! }));
        },
    });

    return steps;
}
