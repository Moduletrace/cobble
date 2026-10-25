import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookSource } from "@/src/dict/bot-hook-dict";
import type { NotifyWatchSync } from "@/src/types";
import createBotHook from "../bot-hooks/create-bot-hook";
import updateBotHook from "../bot-hooks/update-bot-hook";
import checkHookProposal from "./check-hook-proposal";
import claimHookProposal from "./claim-hook-proposal";
import grabHookProposal from "./grab-hook-proposal";

type Params = {
    user_id: number | string;
    proposal_id: number | string;
};

/**
 * The user confirmed a hook proposal from its card: claims it (once, and
 * only while it's pending and not expired), checks it again against the
 * hook and the bot's reach now, then saves it with the Hooks modal's own
 * helpers, as that user. A new hook runs in the session it was proposed
 * in (a new one of its own if that's gone). Returns the proposal and, for a new hook called
 * at a URL, its token: the card shows it this once, and it's never
 * stored in the outcome, which the bot is told. Whatever happens is
 * recorded on the proposal as its `outcome`.
 */
export default async function confirmHookProposal({ user_id, proposal_id }: Params) {
    const proposal = await grabHookProposal({ proposal_id, user_id });

    await claimHookProposal({ proposal, status: "confirmed" });

    let token: string | undefined;

    try {
        const checked = await checkHookProposal({
            user_id,
            bot_id: proposal.bot_id,
            workspace_id: proposal.workspace_id,
            hook_id: proposal.hook_id,
            data: proposal.data,
        });
        const { data } = checked;

        let outcome = "";
        let result_id = 0;

        if (checked.action == "create") {
            const created = await createBotHook({
                user_id,
                bot_id: proposal.bot_id,
                workspace_id: proposal.workspace_id,
                session: proposal.session_id ? Number(proposal.session_id) : "current",
                session_missing_starts_new: true,
                title: data.title!,
                instructions: data.instructions!,
                computer_id: data.computer_id,
                source: data.source as BotHookSource | undefined,
                watch_computer_id: data.watch_computer_id,
                watch_filter: data.watch_filter,
            });

            token = created.token;
            result_id = Number(created.hook.id);
            outcome = `Saved as hook #${result_id}.${watchNote({ token, watch: created.watch })}`;
        } else {
            const hook = await updateBotHook({
                user_id,
                hook_id: checked.current!.id!,
                data: {
                    title: data.title,
                    instructions: data.instructions,
                    watch_filter: data.watch_filter,
                    enabled: data.enabled,
                },
            });
            const changed = [
                data.title !== undefined ? "its name" : "",
                data.instructions !== undefined ? "its brief" : "",
                data.watch_filter !== undefined ? "its filter" : "",
                data.enabled ? "switched back on" : "",
            ].filter(Boolean);

            result_id = Number(hook.id);
            outcome = `Hook #${result_id} changed: ${changed.join(", ")}.`;
        }

        await BunSQLite.sql({
            sql: `UPDATE hook_proposals SET outcome = ?, result_id = ?, updated_at = ? WHERE id = ?`,
            values: [outcome, result_id, Date.now(), proposal.id],
        });
    } catch (error: unknown) {
        const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);

        await BunSQLite.sql({
            sql: `UPDATE hook_proposals SET status = 'failed', outcome = ?, updated_at = ? WHERE id = ?`,
            values: [`Couldn't save it: ${message}`, Date.now(), proposal.id],
        });
    }

    return { proposal, token };
}

/**
 * What a new hook's outcome adds: that its URL went to the user alone, or
 * whether its computer's watcher runs.
 */
function watchNote({ token, watch }: { token?: string; watch?: NotifyWatchSync }) {
    if (token) return ` Its URL was shown once, to the user only.`;

    if (!watch) return "";

    return watch.ok
        ? ` It gets the computer's browser notifications.`
        : ` The computer's watcher isn't running yet: ${watch.error || "unknown error"}`;
}
