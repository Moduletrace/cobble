import BunSQLite from "@moduletrace/bun-sqlite";
import type { HookProposalView } from "@/src/types";
import describeHookProposalDetails from "@/src/utils/describe-hook-proposal-details";
import grabUserBotHook from "../bot-hooks/grab-user-bot-hook";
import grabHookProposal from "./grab-hook-proposal";

type Params = {
    proposal_id: number | string;
    user_id: number | string;
};

/**
 * A hook proposal as its chip and confirm card show it to the user it was
 * proposed to: its details worked out now from what Confirm would save
 * (and, for a change, the hook as it is), the bot's reason beside them.
 */
export default async function grabHookProposalView({ proposal_id, user_id }: Params): Promise<HookProposalView> {
    const proposal = await grabHookProposal({ proposal_id, user_id });
    const { data } = proposal;
    const current = proposal.hook_id
        ? await grabUserBotHook({ user_id, hook_id: proposal.hook_id }).catch(() => null)
        : null;
    const computer_ids = [data.computer_id, data.watch_computer_id].filter(Boolean) as number[];

    const [bot, workspace, computers] = await Promise.all([
        BunSQLite.sql<{ name: string }>({ sql: `SELECT name FROM bots WHERE id = ?`, values: [proposal.bot_id] }),
        proposal.workspace_id
            ? BunSQLite.sql<{ name: string }>({ sql: `SELECT name FROM workspaces WHERE id = ?`, values: [proposal.workspace_id] })
            : null,
        computer_ids.length
            ? BunSQLite.sql<{ id: number; name: string }>({
                  sql: `SELECT id, name FROM computers WHERE id IN (${computer_ids.map(() => "?").join(", ")})`,
                  values: computer_ids,
              })
            : null,
    ]);

    return {
        id: proposal.id,
        action: proposal.action,
        hook_id: proposal.hook_id,
        title: proposal.title,
        bot_id: proposal.bot_id,
        bot_name: bot.payload?.[0]?.name || "The bot",
        status: proposal.status,
        expired: proposal.status == "pending" && proposal.expires_at < Date.now(),
        expires_at: proposal.expires_at,
        outcome: proposal.outcome,
        result_id: proposal.result_id,
        makes_url: proposal.action == "create" && data.source != "browser_notifications",
        details: describeHookProposalDetails({
            action: proposal.action,
            data,
            current,
            workspace_name: workspace?.payload?.[0]?.name || null,
            computers: new Map((computers?.payload || []).map((c) => [Number(c.id), c.name || ""])),
        }),
        reason: proposal.reason,
    };
}
