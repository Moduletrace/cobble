import { z } from "zod";
import type { HarnessTool } from "../../types";

type Params = {
    /**
     * Gets why the run failed. The task runner throws it after the run, so
     * the queue retries the job.
     */
    onFail: (params: { reason: string }) => void;
};

type Args = {
    reason: string;
};

/**
 * Lets a run that acts on its own (a routine's, a hook call's) say it
 * couldn't do what its brief asks (a send that failed, a service that's
 * down), so it's retried later instead of posting a report. Only given to
 * those runs.
 */
export default function reportRunFailedTool({ onFail }: Params): HarnessTool<Args> {
    return {
        name: "report_run_failed",
        description: `Call this when this run (a routine's or a hook call's) couldn't do what its brief asks (a tool or service failed, something it needs is down). The run is tried again later, and the user is told only if every try fails. Say why in one or two sentences. Don't call it for something only the user can do; ask them to take over instead.`,
        schema: z.object({
            reason: z.string().trim().min(1).max(1000).describe("Why the run failed, for the user"),
        }),
        run: async ({ args }) => {
            onFail({ reason: args.reason.trim() });

            return `Recorded. Stop here: the run will be tried again later. Don't write a report.`;
        },
    };
}
