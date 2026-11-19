import hasOpenWork from "@/src/functions/backend/db/bots-queue/has-open-work";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import grabBotFileScope from "@/src/functions/backend/db/bot-files/grab-bot-file-scope";
import userReachesFileScope from "@/src/functions/backend/db/bot-files/user-reaches-file-scope";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import { taskRowSql } from "@/src/functions/backend/db/tasks/run-task-sql";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabBotGraphic from "@/src/functions/backend/db/bot-graphics/grab-bot-graphic";
import describeToolUses from "@/src/harness/text/describe-tool-uses";
import type { HarnessToolUse } from "@/src/harness/types";
import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import replyClaimProblems, { AppCardRefTools, type AppCardRefKind } from "@/src/utils/reply-claim-problems";
import replyRefIds from "@/src/utils/reply-ref-ids";
import mentionedTaskIds from "@/src/utils/mentioned-task-ids";
import unresolvedSettingRefs from "@/src/utils/unresolved-setting-refs";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    text: string;
    tool_uses: HarnessToolUse[];
    bot_id: number | string;
    user_id: number | string;
    session_id: number | string;
    /**
     * The run being reviewed. A task run's own job is open while it writes
     * its report, so it must not count as work that is still to come.
     */
    job_id?: number | string;
    /**
     * What the reply declared with `send_reply`.
     */
    status?: ReplyStatus;
    /**
     * The run's folders (`grabRunScopes`).
     */
    scopes: StorageScope[];
};

/**
 * Checks a chat reply's answer against what the app knows before it goes
 * out (`replyClaimProblems`): every file, task and graphic it names must
 * exist for the user (as their chips would open them), every setting ref
 * the app can resolve, no ref of a card the app adds itself written by hand
 * (`AppCardRefTools`), and work it says is under
 * way must have been started by this reply or still be open from this
 * conversation. Returns the note that sends the answer back to be written
 * again, or null when it holds up. Bots wrote "I'm scanning now" with the
 * scan's made-up results in the same answer, and the user acted on them;
 * one wrote `[suggestion:11]` after the last real one was `[suggestion:10]`
 * and the user got buttons reading "not available".
 */
export default async function reviewBotReply({ text, tool_uses, bot_id, user_id, session_id, job_id, status, scopes }: Params) {
    if (!text.trim()) return null;

    const missing_file_ids: number[] = [];

    for (const file_id of replyRefIds({ text, kind: "file" })) {
        if (!(await fileExistsForUser({ file_id, user_id, scopes }))) missing_file_ids.push(file_id);
    }

    const missing_task_ids: number[] = [];
    const task_ref_ids = replyRefIds({ text, kind: "task" });

    for (const task_id of task_ref_ids) {
        if (await taskRowMissing({ task_id, user_id })) missing_task_ids.push(task_id);
    }

    /**
     * The same check for a task named in plain prose (`task #16`). A row
     * the user cannot open is left alone: only a missing row is a lie.
     */
    const missing_mentioned_task_ids: number[] = [];

    for (const task_id of mentionedTaskIds({ text })) {
        if (task_ref_ids.includes(task_id)) continue;

        if (await taskRowMissing({ task_id, user_id })) missing_mentioned_task_ids.push(task_id);
    }

    const missing_graphic_ids: number[] = [];

    for (const graphic_id of replyRefIds({ text, kind: "graphic" })) {
        if (!(await grabBotGraphic({ graphic_id, user_id }))) missing_graphic_ids.push(graphic_id);
    }

    /**
     * The cards the app adds under the message itself: any ref of theirs in
     * the answer was written by the model, since the app's own refs are
     * added after this check (`withTakeOverRefs`).
     */
    const written_card_refs = (Object.keys(AppCardRefTools) as AppCardRefKind[]).flatMap((kind) =>
        replyRefIds({ text, kind }).map((id) => `[${kind}:${id}]`),
    );

    const problems = replyClaimProblems({
        text,
        tool_uses,
        missing_file_ids,
        missing_task_ids,
        missing_mentioned_task_ids,
        unresolved_setting_refs: unresolvedSettingRefs({ text }),
        missing_graphic_ids,
        written_card_refs,
        has_open_work: await hasOpenWork({ bot_id, session_id, exclude_job_id: job_id }),
        status,
    });

    if (!problems.length) return null;

    return `Your answer above was not sent: the app checked it against its record, and it doesn't hold up.

${problems.map((problem) => `- ${problem}`).join("\n")}

The tools you actually called in this reply: ${describeToolUses({ uses: tool_uses })}. Nothing else happened. Write the answer again, saying only what those tools returned and what the user told you. If the work still needs doing, call send_reply with status "working" and work now, and say it's started; never describe results of work no tool did, and never promise a report nothing will send. If part of your answer was wrong, say so plainly.`;
}

/**
 * A named task is a fault only when no row has that id. A row the user
 * cannot open is still a real task, so naming it is not a made-up id.
 */
async function taskRowMissing({ task_id, user_id }: { task_id: number; user_id: number | string }): Promise<boolean> {
    const reached = await assertUserReachesTask({ user_id, task_id }).catch(() => null);

    if (reached?.id) return false;

    const exists = await BunSQLite.sql<{ id: number }>(taskRowSql({ task_id }));

    return !exists.payload?.[0]?.id;
}

/**
 * Whether a file chip would open for the user: in the run's folders, or
 * in another folder the user reaches (an answer passed on from a room).
 */
async function fileExistsForUser({
    file_id,
    user_id,
    scopes,
}: {
    file_id: number;
    user_id: number | string;
    scopes: StorageScope[];
}) {
    if ((await grabBotFile({ scopes, file_id }))?.id) return true;

    const elsewhere = await grabBotFileScope({ file_id });

    if (!elsewhere || !(await userReachesFileScope({ ...elsewhere, user_id }))) return false;

    return Boolean((await grabBotFile({ scopes: [elsewhere], file_id }))?.id);
}

