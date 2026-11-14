import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { AskGateNote, AskGateRequest } from "@/src/data/harness-prompts";
import applyAskDecision from "@/src/functions/backend/db/asks/apply-ask-decision";
import askableBots from "@/src/functions/backend/db/asks/askable-bots";
import finishAsk from "@/src/functions/backend/db/asks/finish-ask";
import grabAsk from "@/src/functions/backend/db/asks/grab-ask";
import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import generateText from "@/src/harness/text/generate-text";
import type { HarnessMessage } from "@/src/harness/types";
import BotJobFatalError from "./bot-job-fatal-error";
import type { BotJobOutcome } from "./types";
import parseAskDecision from "./parse-ask-decision";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    user_id: number;
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    params: { ask_id?: number | string };
    signal: AbortSignal;
};

/**
 * The gate: one turn, no tools. The coordinator reads another bot's request
 * and answers approve, redirect or refuse; the app then sends it on or ends
 * it (`applyAskDecision`). It fails closed: an answer that can't be used is
 * asked for once more, and a gate that still can't decide fails the ask
 * rather than letting it through.
 */
export default async function runAskReview({
    bot,
    user_id,
    job,
    params,
    signal,
}: Params): Promise<BotJobOutcome> {
    const ask = await grabAsk({ ask_id: Number(params.ask_id) || 0, user_id });

    if (!ask?.id) throw new BotJobFatalError(`That request no longer exists.`);

    if (ask.status != "pending") return { result: "", silent: true };

    const requester = await grabBotById({ bot_id: ask.requester_bot_id! });

    if (!requester?.id) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: "The bot that asked no longer exists.",
        });

        return { result: "", silent: true };
    }

    const askable = await askableBots({
        user_id,
        requester_bot_id: requester.id,
        workspace_id: Number(ask.workspace_id) || undefined,
    });

    /**
     * The bot the asker named, if it did: the gate is told it is a
     * suggestion, so it neither assumes it nor wonders why none was made.
     */
    const named = askable.find((member) => Number(member.id) == Number(ask.target_bot_id));
    const suggested = named
        ? `[bot:${named.id}] ${named.name || "A bot"}`
        : null;

    const system = [
        await grabBotPrompt({ bot_id: bot.id!, user_id, workspace_id: ask.workspace_id }),
        AskGateNote({
            requester: `${requester.name || "A bot"} (${requester.id})`,
            askable: askable.map((member) => `${member.id}: ${member.name || "A bot"}`),
            in_workspace: Boolean(ask.workspace_id),
            suggested,
        }),
    ].join("\n\n");

    const messages: HarnessMessage[] = [
        { role: "system", content: system },
        {
            role: "user",
            content: AskGateRequest({
                requester_id: requester.id,
                requester_name: requester.name || "A bot",
                in_workspace: Boolean(ask.workspace_id),
                title: ask.title || "Request",
                request: ask.request || "",
                suggested,
            }),
        },
    ];

    let problem = "The answer wasn't a JSON decision.";

    for (let attempt = 0; attempt < AppData.AskGateAttempts; attempt++) {
        const answer = await generateText({
            messages,
            signal,
            bot_id: Number(bot.id),
            workspace_id: Number(ask.workspace_id) || undefined,
        });

        const decision = parseAskDecision({ text: answer.text || "" });
        const target =
            decision?.decision != "refuse"
                ? askable.find(
                      (member) =>
                          Number(member.id) ==
                          Number(decision?.target_bot_id || (decision?.decision == "approve" ? ask.target_bot_id : 0)),
                  ) || null
                : null;

        if (decision && (decision.decision == "refuse" || target?.id)) {
            await applyAskDecision({
                ask,
                decision: decision.decision,
                reason: decision.reason.slice(0, AppData.AskReasonMaxChars),
                target,
                requester_name: requester.name || "A bot",
            });

            return { result: "", silent: true };
        }

        problem = decision
            ? `The bot it chose can't be asked from here. Choose one of the ids listed.`
            : "The answer wasn't a JSON decision.";

        messages.push(
            { role: "assistant", content: answer.text },
            {
                role: "user",
                content: `${problem} Answer with the JSON object only.`,
            },
        );
    }

    throw new BotJobFatalError(problem);
}
