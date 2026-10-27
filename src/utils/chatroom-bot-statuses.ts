import type { ChatroomBot, ChatroomSummary } from "@/src/types";

type Params = {
    room: Pick<ChatroomSummary, "status" | "requester_bot_id" | "bots" | "jobs">;
    /**
     * The latest step pushed for each room session, newer than the step the
     * room was read with.
     */
    steps?: Record<number, string>;
};

export type ChatroomBotStatus = {
    bot: ChatroomBot;
    label: string;
    /**
     * Its latest step, while it works.
     */
    detail: string | null;
    /**
     * Working now (a job of its runs or waits to run).
     */
    active: boolean;
};

/**
 * Where each bot of an open room stands, for the rows under the thread:
 * the asking bot waits for the answer, the coordinator thinks or waits on
 * whoever it asked, an asked bot works (with its latest step) or is done.
 * A closed room has none.
 */
export default function chatroomBotStatuses({ room, steps = {} }: Params): ChatroomBotStatus[] {
    if (room.status != "open") return [];

    const jobs = room.jobs || [];

    return room.bots.map((bot) => {
        const name = bot.name || "A bot";
        const job = jobs.find((item) => item.bot_id == bot.id);
        const step = job ? steps[job.session_id] || job.progress || null : null;
        const is_coordinator = bot.kind == "coordinator";

        if (job) {
            const started = job.status == "processing" || Boolean(step);

            return {
                bot,
                label: !started
                    ? `${name} is getting to it…`
                    : is_coordinator
                      ? `${name} is thinking…`
                      : `${name} is working…`,
                detail: started ? step : null,
                active: true,
            };
        }

        if (bot.id == room.requester_bot_id) {
            return { bot, label: `${name} is waiting for the answer`, detail: null, active: false };
        }

        if (is_coordinator) {
            const waiting_on = room.bots
                .filter((other) => other.id != bot.id && jobs.some((item) => item.bot_id == other.id))
                .map((other) => other.name || "a bot");

            return {
                bot,
                label: waiting_on.length ? `${name} is waiting on ${waiting_on.join(", ")}` : `${name} is passing it on`,
                detail: null,
                active: false,
            };
        }

        return { bot, label: `${name} is done`, detail: null, active: false };
    });
}
