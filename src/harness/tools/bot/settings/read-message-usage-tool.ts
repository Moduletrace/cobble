import { z } from "zod";
import grabRunLimitsOverview from "@/src/functions/backend/db/app-settings/grab-run-limits";
import {
    grabJobRunUsage,
    grabMessageRunUsage,
    grabSessionMessageUsage,
    type CurrentRunLimits,
} from "@/src/functions/backend/db/usage/grab-run-usage";
import { grabHarnessUsageScope } from "@/src/harness/usage/harness-usage-scope";
import describeRunUsage, { describeMessageUsageList } from "@/src/utils/describe-run-usage";
import type { HarnessTool } from "../../../types";

type Params = {
    session_id?: number | string | null;
};

type Args = {
    message_id?: number;
    job_id?: number;
    latest?: boolean;
};

/**
 * What a run or one of its answers cost, call by call: the model, the
 * prompt and completion tokens, the cached part, the settings each call was
 * made with, and the limits the run worked under against today's. With no
 * ids it lists the conversation's latest messages so a bot can find the one
 * a user is asking about, then read it by id.
 */
export default function readMessageUsageTool({ session_id }: Params): HarnessTool<Args> {
    return {
        name: "read_message_usage",
        description: `Look at what model calls a run cost, to answer "why did that cost so much" or "why was that reply cut short".

With no arguments it lists this conversation's latest messages with their token totals and ids. Pass a message_id to dig into one: every call it took (provider and model, prompt and completion tokens, how much came from the model's cache), the limits the run worked under as recorded then, today's limits for comparison, and the tools it called, counted.

Long runs cost more than the work suggests because every turn resends the prompt, the tool definitions and the whole transcript: many steps, or a long session re-read each time, is the usual cause. When you have read the calls, say what happened and, when a setting explains it, name that setting with its value and the ref from read_settings so the user can change it. Never guess a figure: report only what you read.`,
        schema: z.object({
            message_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("The message to read (ids come from this conversation's list, or from a past session you read)."),
            job_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("A run's job id, for a run whose message isn't written yet. Leave it out to read the run you are in."),
            latest: z.boolean().optional().describe("List the conversation's latest messages again."),
        }),
        run: async ({ args }) => {
            const limits = await grabRunLimitsOverview().catch(() => null);
            const current_limits: CurrentRunLimits = {
                task_steps: limits?.task_steps ?? limits?.task_default ?? 0,
                reply_steps: limits?.reply_steps ?? limits?.reply_default ?? 0,
                unattended_steps: limits?.unattended_steps ?? limits?.unattended_default ?? 0,
                run_tokens: limits?.run_tokens ?? limits?.run_tokens_default ?? 0,
                context_tokens: limits?.context_tokens ?? limits?.context_tokens_default ?? 0,
            };
            const scope = grabHarnessUsageScope();
            const run_session_id = Number(scope?.session_id) || Number(session_id) || 0;

            if (!args.message_id && !args.job_id && args.latest) {
                return describeMessageUsageList({ messages: await grabSessionMessageUsage({ session_id: run_session_id }) });
            }

            if (args.message_id) {
                const usage = await grabMessageRunUsage({ message_id: args.message_id, session_id: run_session_id });

                if (!usage) {
                    return `Message #${args.message_id} isn't in this conversation. Read the list by calling again with latest: true, or read a past session first.`;
                }

                return describeRunUsage({ usage: { ...usage, current_limits } });
            }

            const job_id = args.job_id || Number(scope?.job_id) || 0;

            if (!job_id) return describeMessageUsageList({ messages: await grabSessionMessageUsage({ session_id: run_session_id }) });

            const usage = await grabJobRunUsage({ job_id });

            if (!usage) {
                return `No model calls recorded for run #${job_id} yet.`;
            }

            return describeRunUsage({ usage: { ...usage, current_limits } });
        },
    };
}