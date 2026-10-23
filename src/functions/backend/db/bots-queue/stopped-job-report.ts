import { BotStoppedMessage } from "@/src/dict/bot-queue-dict";

type Job = {
    session_id?: number | string | null;
    kind?: string | null;
    title?: string | null;
};

/**
 * What the bot says in a conversation the user stopped it in. A task names
 * the work that was cut off, so a long job that quietly went nowhere reads
 * as stopped rather than as finished; a reply has no title worth quoting.
 */
export default function stoppedJobReport({ job }: { job: Job }): string {
    const title = (job.title || "").trim();

    return job.kind == "task" && title
        ? `${BotStoppedMessage} I was on **${title}**.`
        : BotStoppedMessage;
}

/**
 * The job that speaks for each session: one per session, since a reply and
 * the task it started are the same conversation and two notes there read as
 * a stutter. A task wins, because it's the one that can name the work.
 */
export function pickReportedJobs<T extends Job>({ jobs }: { jobs: T[] }): Map<number, T> {
    const picked = new Map<number, T>();

    for (const job of jobs) {
        /**
         * A job with no session is stopped all the same; it just has
         * nowhere to report it.
         */
        if (job.session_id === null || job.session_id === undefined) continue;

        const known = picked.get(Number(job.session_id));

        if (!known || (known.kind != "task" && job.kind == "task")) {
            picked.set(Number(job.session_id), job);
        }
    }

    return picked;
}
