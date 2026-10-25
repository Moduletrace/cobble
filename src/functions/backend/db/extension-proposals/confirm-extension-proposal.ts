import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import redactSecrets from "@/src/utils/redact-secrets";
import grabAllEnvs from "../envs/grab-all-envs";
import grabCustomTool from "../extensions/grab-custom-tool";
import grabMcpServer from "../extensions/grab-mcp-server";
import saveCustomTool from "../extensions/save-custom-tool";
import saveMcpServer from "../extensions/save-mcp-server";
import grabSkill from "../extensions/grab-skill";
import saveSkill from "../extensions/save-skill";
import syncMcpServer from "../extensions/sync-mcp-server";
import extensionEnvUses from "@/src/utils/extension-env-uses";
import skillProposalChanges from "@/src/utils/skill-proposal-changes";
import checkProposalData from "./check-proposal-data";
import claimExtensionProposal from "./claim-extension-proposal";
import grabExtensionProposal from "./grab-extension-proposal";
import grabProposalEnvs from "./grab-proposal-envs";

type Params = {
    user_id: number | string;
    proposal_id: number | string;
};

/**
 * The user confirmed a proposal from its card: claims it (once, and only
 * while it's pending and not expired), checks it again, then saves it
 * with the settings pages' own helpers. A skill is saved as proposed. A server or tool that sends a key
 * that isn't saved yet is saved switched off, and the outcome names the
 * keys to add. A remote server that's on is connected and its tools
 * listed. Whatever happens is recorded on the proposal as its `outcome`.
 */
export default async function confirmExtensionProposal({ user_id, proposal_id }: Params) {
    const proposal = await grabExtensionProposal({ proposal_id, user_id });

    await claimExtensionProposal({ proposal, status: "confirmed" });

    try {
        if (proposal.kind == "skill") {
            const current = proposal.extension_id ? await grabSkill({ skill_id: proposal.extension_id }) : null;
            const changes = skillProposalChanges({ data: proposal.data, current });

            const result_id = await saveSkill({
                user_id,
                data: { ...proposal.data, skill_id: proposal.extension_id || undefined },
            });
            const outcome = `Saved as skill #${result_id} (slug ${proposal.data.slug}).${
                current ? describeSavedChanges({ fields: changes.fields }) : ""
            }${!proposal.extension_id && !proposal.data.all_bots ? " No bot gets it yet." : ""}`;

            await BunSQLite.sql({
                sql: `UPDATE extension_proposals SET outcome = ?, result_id = ?, updated_at = ? WHERE id = ?`,
                values: [outcome, result_id, Date.now(), proposal.id],
            });

            return proposal;
        }

        checkProposalData(proposal);

        const { sends } = extensionEnvUses(proposal);
        const missing = [
            ...new Set(
                (await grabProposalEnvs({ sends })).filter((env) => !env.saved_in.length).map((env) => env.key),
            ),
        ];
        const keys_note = missing.length
            ? ` It's switched off until ${missing.length == 1 ? "this key is" : "these keys are"} added in Settings, under Environment: ${missing.join(", ")}. Then switch it on in Settings, under ${proposal.kind == "mcp" ? "MCPs" : "Tools"}.`
            : "";

        let outcome = "";
        let result_id = 0;

        if (proposal.kind == "mcp") {
            if (proposal.extension_id) {
                const current = await grabMcpServer({ mcp_server_id: proposal.extension_id });

                if (current.transport != "remote") throw new AppError(`${current.name} runs a command here, so it can't be changed from a proposal.`);
            }

            const data = { ...proposal.data, mcp_server_id: proposal.extension_id || undefined, enabled: proposal.data.enabled && !missing.length };

            result_id = await saveMcpServer({ user_id, data });

            const sync = data.enabled ? await syncMcpServer({ mcp_server_id: result_id }) : null;

            outcome = `Saved as MCP server #${result_id}.${keys_note}${
                !sync
                    ? missing.length
                        ? ""
                        : " It's off, so it wasn't connected."
                    : sync.ok
                      ? ` It connected and lists ${sync.tools.length} ${sync.tools.length == 1 ? "tool" : "tools"}.`
                      : ` It didn't connect: ${sync.error}`
            }`;
        } else {
            if (proposal.extension_id) await grabCustomTool({ custom_tool_id: proposal.extension_id });

            const data = { ...proposal.data, custom_tool_id: proposal.extension_id || undefined, enabled: proposal.data.enabled && !missing.length };

            result_id = await saveCustomTool({ user_id, data });
            outcome = `Saved as tool #${result_id}.${keys_note}`;
        }

        if (!proposal.extension_id && !proposal.data.all_bots) outcome += ` No bot gets it yet.`;

        await BunSQLite.sql({
            sql: `UPDATE extension_proposals SET outcome = ?, result_id = ?, updated_at = ? WHERE id = ?`,
            values: [outcome, result_id, Date.now(), proposal.id],
        });
    } catch (error: unknown) {
        const secrets = (await grabAllEnvs()).filter((env) => env.secret);
        const message = redactSecrets({
            text: error instanceof Error ? error.message : String(error),
            secrets,
        }).slice(0, 2000);

        await BunSQLite.sql({
            sql: `UPDATE extension_proposals SET status = 'failed', outcome = ?, updated_at = ? WHERE id = ?`,
            values: [`Couldn't save it: ${message}`, Date.now(), proposal.id],
        });
    }

    return proposal;
}

/**
 * What a confirmed change to a skill changed, so a runbook that stayed the
 * same never reads as saved.
 */
function describeSavedChanges({ fields }: { fields: string[] }) {
    if (!fields.length) return " Nothing changed: it was already saved like this.";

    const named = fields.length == 1 ? fields[0] : `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
    const runbook = fields.includes("runbook") ? "" : " The runbook is unchanged.";

    return ` Changed: ${named}.${runbook}`;
}
