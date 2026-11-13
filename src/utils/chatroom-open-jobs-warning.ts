type Job = {
    id: number | string;
    bot_name?: string | null;
    status?: string | null;
};

type Params = {
    /**
     * The room's open jobs (`grabChatroomOpenJobs`).
     */
    jobs: Job[];
    /**
     * What the coordinator was about to do: "Answering", "Turning it down".
     */
    closing: string;
};

/**
 * Why a room can't be closed yet: closing cancels whatever still runs in it
 * (`cancelChatroomJobs`), so a coordinator that answers over a member's
 * live work throws that work away. Written as the tool's error, so the
 * coordinator reads who is busy and asks again instead. Empty with no open
 * job: then there is nothing to warn about.
 */
export default function chatroomOpenJobsWarning({ jobs, closing }: Params): string {
    if (!jobs.length) return "";

    const working = jobs
        .map((job) => `${job.bot_name || "A bot"} (run #${job.id}${job.status ? `, ${job.status}` : ""})`)
        .join(", ");

    return `Still working here: ${working}. ${closing} closes the room and cancels that run, so the work is lost. Ask them where they stand first, or pass close_anyway: true when the outcome doesn't depend on what they find.`;
}