import BunSQLite from "@moduletrace/bun-sqlite";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import grabBotFileScope from "@/src/functions/backend/db/bot-files/grab-bot-file-scope";
import userReachesFileScope from "@/src/functions/backend/db/bot-files/user-reaches-file-scope";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import describeToolUses from "@/src/harness/text/describe-tool-uses";
import type { HarnessToolUse } from "@/src/harness/types";
import replyClaimProblems from "@/src/utils/reply-claim-problems";
import replyRefIds from "@/src/utils/reply-ref-ids";
import unresolvedSettingRefs from "@/src/utils/unresolved-setting-refs";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    text: string;
    tool_uses: HarnessToolUse[];
    bot_id: number | string;
    user_id: number | string;
    session_id: number | string;
    /**
     * The run's folders (`grabRunScopes`).
     */
    scopes: StorageScope[];
};

/**
 * Checks a chat reply's answer against what the app knows before it goes
 * out (`replyClaimProblems`): every file and task it names must exist for
 * the user (as their chips would open them), every setting ref the app can
 * resolve, and work it says is under
 * way must have been started by this reply or still be open from this
 * conversation. Returns the note that sends the answer back to be written
 * again, or null when it holds up. Bots wrote "I'm scanning now" with the
 * scan's made-up results in the same answer, and the user acted on them.
 */
export default async function reviewBotReply({ text, tool_uses, bot_id, user_id, session_id, scopes }: Params) {
    if (!text.trim()) return null;

    const missing_file_ids: number[] = [];

    for (const file_id of replyRefIds({ text, kind: "file" })) {
        if (!(await fileExistsForUser({ file_id, user_id, scopes }))) missing_file_ids.push(file_id);
    }

    const missing_task_ids: number[] = [];

    for (const task_id of replyRefIds({ text, kind: "task" })) {
        const reached = await assertUserReachesTask({ user_id, task_id }).catch(() => null);

        if (!reached?.id) missing_task_ids.push(task_id);
    }

    const problems = replyClaimProblems({
        text,
        tool_uses,
        missing_file_ids,
        missing_task_ids,
        unresolved_setting_refs: unresolvedSettingRefs({ text }),
        has_open_work: await hasOpenWork({ bot_id, session_id }),
    });

    if (!problems.length) return null;

    return `Your answer above was not sent: the app checked it against its record, and it doesn't hold up.

${problems.map((problem) => `- ${problem}`).join("\n")}

The tools you actually called in this reply: ${describeToolUses({ uses: tool_uses })}. Nothing else happened. Write the answer again, saying only what those tools returned and what the user told you. If the work still needs doing, call start_task now and say it's started; never describe results of work no tool did, and never promise a report nothing will send. If part of your answer was wrong, say so plainly.`;
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

/**
 * A run of the bot's in this session, a job it handed over from here, or
 * a room it asked from here, still open: its result is still to come.
 */
async function hasOpenWork({ bot_id, session_id }: { bot_id: number | string; session_id: number | string }) {
    const jobs = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM bots_queue
            WHERE status IN ('pending', 'processing') AND kind = 'task'
                AND ((bot_id = ? AND session_id = ?) OR requested_by_session_id = ?)
            LIMIT 1`,
        values: [Number(bot_id), Number(session_id), Number(session_id)],
    });

    if (jobs.payload?.[0]) return true;

    const rooms = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM chatrooms WHERE status = 'open' AND requester_bot_id = ? AND origin_session_id = ? LIMIT 1`,
        values: [Number(bot_id), Number(session_id)],
    });

    return Boolean(rooms.payload?.[0]);
}
