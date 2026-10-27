import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { chatroomCoordinatorNote } from "@/src/data/harness-prompts";
import chatroomAskableBots from "@/src/functions/backend/db/chatrooms/chatroom-askable-bots";
import grabChatroom from "@/src/functions/backend/db/chatrooms/grab-chatroom";
import grabChatroomMessages from "@/src/functions/backend/db/chatrooms/grab-chatroom-messages";
import runTextLoop from "@/src/harness/text/run-text-loop";
import askMemberTool from "@/src/harness/tools/chatroom/ask-member-tool";
import answerRequesterTool from "@/src/harness/tools/chatroom/answer-requester-tool";
import refuseRequestTool from "@/src/harness/tools/chatroom/refuse-request-tool";
import stripAppRecords from "@/src/utils/strip-app-records";
import BotJobFatalError from "./bot-job-fatal-error";
import chatroomTurns from "./chatroom-turns";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number };
    user_id: number;
};

/**
 * The coordinator's turn in a chatroom: it reads the room (the request and
 * what every bot said since, theirs fenced as data, `crewMessageBlock`)
 * and acts with the room's three tools only: ask a bot, answer the bot
 * that asked, or refuse. None of its crew tools, memory or prompt come
 * along: in a member's room it works for that member, and the room is all
 * it needs. Its words are a short note in the room. A room that closed in
 * the meantime is left silently.
 */
export default async function runChatroomTurn({
    bot,
    user_id,
    job,
    params,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    const room = await grabChatroom({ chatroom_id: Number(params.chatroom_id) || 0 });

    if (!room?.id || Number(room.user_id) != user_id) {
        throw new BotJobFatalError(`The chatroom for this turn no longer exists.`);
    }

    if (room.status != "open") return { result: "", silent: true };

    const askable = await chatroomAskableBots({
        user_id,
        requester_bot_id: room.requester_bot_id || 0,
        workspace_id: room.workspace_id || null,
    });

    const messages = await grabChatroomMessages({ chatroom_id: room.id });
    const names = await botNames({ ids: messages.map((message) => Number(message.bot_id)) });

    let acted = "";

    const tools = [
        askMemberTool({ chatroom: room, onAsked: () => (acted = "asked") }),
        answerRequesterTool({ chatroom: room, job_id: job.id || null, onClosed: () => (acted = "answered") }),
        refuseRequestTool({ chatroom: room, job_id: job.id || null, onClosed: () => (acted = "refused") }),
    ];

    const result = await runTextLoop({
        system: [
            chatroomCoordinatorNote({
                requester_id: room.requester_bot_id || 0,
                askable,
                in_workspace: Boolean(room.workspace_id),
                turns_left: Math.max(0, AppData.ChatroomMaxCoordinatorTurns - Number(room.coordinator_turns || 0)),
            }),
            `Now: ${new Date().toUTCString()}.`,
        ].join("\n\n"),
        messages: chatroomTurns({ messages, coordinator_id: bot.id, requester_id: Number(room.requester_bot_id), names }),
        tools,
        max_steps: AppData.ChatroomCoordinatorMaxToolSteps,
        bot_id: bot.id,
        workspace_id: room.workspace_id || null,
        signal,
        onStep: report,
    });

    const text = stripAppRecords({ text: result.text }).trim();

    return {
        result:
            text ||
            (acted == "asked"
                ? "Passed it on."
                : acted == "answered"
                  ? "Sent the answer back."
                  : acted == "refused"
                    ? "Turned it down."
                    : ""),
        tool_log: result.tool_uses,
    };
}

async function botNames({ ids }: { ids: number[] }) {
    const unique = [...new Set(ids.filter(Boolean))];

    if (!unique.length) return new Map<number, string>();

    const rows =
        (
            await BunSQLite.sql<{ id: number; name: string }>({
                sql: `SELECT id, name FROM bots WHERE id IN (${unique.map(() => "?").join(", ")})`,
                values: unique,
            })
        ).payload || [];

    return new Map(rows.map((row) => [Number(row.id), row.name || "A bot"]));
}
