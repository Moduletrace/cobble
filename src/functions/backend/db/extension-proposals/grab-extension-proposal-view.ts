import type { ExtensionProposalView } from "@/src/types";
import describeProposalDetails from "@/src/utils/describe-proposal-details";
import describeSkillProposal from "@/src/utils/describe-skill-proposal";
import grabSkill from "../extensions/grab-skill";
import extensionEnvUses from "@/src/utils/extension-env-uses";
import grabExtensionProposal from "./grab-extension-proposal";
import grabProposalEnvs from "./grab-proposal-envs";
import type { ExtensionProposalRecord } from "./parse-proposal-row";

type Params = {
    proposal_id: number | string;
    user_id: number | string;
};

/**
 * A proposal as its chip and confirm card show it: the facts (host, envs
 * and whether each is saved, every detail of the config; for a skill what
 * its runbook points at and what changed) worked out from the config now,
 * so a key added since shows as saved; the bot's research beside them,
 * labelled as its own.
 */
export default async function grabExtensionProposalView({ proposal_id, user_id }: Params): Promise<ExtensionProposalView> {
    const proposal = await grabExtensionProposal({ proposal_id, user_id });
    const facts = await grabProposalFacts({ proposal });

    return {
        id: proposal.id,
        kind: proposal.kind,
        extension_id: proposal.extension_id,
        name: proposal.name,
        status: proposal.status,
        expired: proposal.status == "pending" && proposal.expires_at < Date.now(),
        expires_at: proposal.expires_at,
        outcome: proposal.outcome,
        result_id: proposal.result_id,
        ...facts,
        research: proposal.research,
        sources: proposal.sources,
    };
}

/**
 * The facts a proposal's card shows, worked out now: for a server or tool
 * its host, its envs and whether each is saved, and its config; for a
 * skill what its runbook points bots at and what changed against the
 * saved one (a deleted skill shows as new).
 */
async function grabProposalFacts({ proposal }: { proposal: ExtensionProposalRecord }) {
    if (proposal.kind == "skill") {
        const current = proposal.extension_id
            ? await grabSkill({ skill_id: proposal.extension_id }).catch(() => null)
            : null;

        return { host: null, envs: [], details: describeSkillProposal({ data: proposal.data, current }) };
    }

    const typed =
        proposal.kind == "mcp"
            ? ({ kind: "mcp", data: proposal.data } as const)
            : ({ kind: "tool", data: proposal.data } as const);
    const { host, sends } = extensionEnvUses(typed);

    return {
        host,
        envs: await grabProposalEnvs({ sends }),
        details: describeProposalDetails({ ...typed, is_new: !proposal.extension_id }),
    };
}
