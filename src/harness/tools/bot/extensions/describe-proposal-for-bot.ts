import type { ExtensionProposalView } from "@/src/types";
import proposalRef from "@/src/utils/proposal-ref";
import type { SkillProposalChanges } from "@/src/utils/skill-proposal-changes";

type Params = {
    view: ExtensionProposalView;
    /**
     * For a change to a skill: what it makes different, so the bot knows
     * whether its new runbook is in the proposal at all.
     */
    skill_changes?: SkillProposalChanges;
};

/**
 * What a bot is told once it proposed a server, tool or skill: the ref to put in
 * its reply, and the facts the card shows (worked out by the app), so it
 * tells the user the same thing the card does.
 */
export default function describeProposalForBot({ view, skill_changes }: Params) {
    const ref = proposalRef({ id: view.id });
    const keys = view.envs.length
        ? view.envs
              .map((env) => `${env.key} (${env.where}): ${env.saved_in.length ? `saved, ${env.saved_in.join(", ")}` : "missing"}`)
              .join("; ")
        : "none";
    const missing = [...new Set(view.envs.filter((env) => !env.saved_in.length).map((env) => env.key))];

    if (view.kind == "skill") {
        const line = (label: string) => view.details.find((detail) => detail.label == label)?.value || "none";

        return [
            `Proposed as ${ref}. Nothing is saved yet: the user confirms or rejects it from the card ${ref} becomes in your reply, so put ${ref} in your reply.`,
            `The card shows the whole runbook${view.extension_id ? " and what changed" : ""}, and what it points bots at: hosts: ${line("Hosts")}; tool names: ${line("Tool names")}; about secrets: ${line("About secrets")}.`,
            ...(skill_changes ? [describeSkillChanges({ changes: skill_changes })] : []),
            `In your reply, say in plain words what the skill makes bots do, anything in it that sends something out or touches secrets, and where its content came from.`,
            `Don't say it's added: the user's next message says whether they confirmed it and what happened.`,
        ].join("\n");
    }

    return [
        `Proposed as ${ref}. Nothing is saved yet: the user confirms or rejects it from the card ${ref} becomes in your reply, so put ${ref} in your reply.`,
        `The card shows: sends to ${view.host || "nothing from the app"}; keys: ${keys}.`,
        `In your reply, say in plain words what it is, where it sends and which keys it uses, naming the ones already saved and the ones missing${missing.length ? ` (${missing.join(", ")}: the user adds them in Settings, under Environment, and you never ask for their values in chat)` : ""}, plus what your background check found.`,
        `Don't say it's added: the user's next message says whether they confirmed it and what happened.`,
    ].join("\n");
}

function describeSkillChanges({ changes }: { changes: SkillProposalChanges }) {
    const runbook = changes.body_changed
        ? ` The runbook is the one you sent (${changes.body_chars} characters, was ${changes.was_body_chars}).`
        : ` The runbook stays as saved: this proposal doesn't change it. If you meant to change it, propose again with the whole new runbook in body, and tell the user this card doesn't.`;

    return `It changes: ${changes.fields.join(", ")}.${runbook}`;
}
