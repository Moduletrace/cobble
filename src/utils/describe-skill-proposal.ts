import type { SaveSkillRequest } from "@/src/schemas/extension-schema";
import type { ExtensionProposalDetail, SkillRecord } from "@/src/types";
import diffLines from "./diff-lines";
import findSkillMentions from "./find-skill-mentions";

type Params = {
    data: SaveSkillRequest;
    /**
     * The skill as saved now, for a change: what's different is shown.
     */
    current: SkillRecord | null;
};

/**
 * A proposed skill, line by line, read by the app from the runbook
 * Confirm would save: what it points bots at (links, hosts, tool names,
 * anything about secrets), for a change what's different from the saved
 * one, then the whole runbook as plain text.
 */
export default function describeSkillProposal({ data, current }: Params): ExtensionProposalDetail[] {
    const found = findSkillMentions({ text: [data.description, data.body].join("\n") });
    const changed = ({ now, was }: { now: string; was?: string }) => (current && was != now ? `${now} (was: ${was || "empty"})` : now);

    return [
        { label: "Name", value: changed({ now: data.name, was: current?.name }) },
        { label: "Slug", value: changed({ now: data.slug, was: current?.slug }) },
        { label: "When it applies", value: changed({ now: data.description, was: current?.description }) },
        { label: "Links in it", value: found.urls.join("\n") || "none", block: found.urls.length > 0 },
        { label: "Hosts", value: found.hosts.join(", ") || "none" },
        { label: "Tool names", value: found.tools.join(", ") || "none" },
        { label: "About secrets", value: found.secrets.join(", ") || "nothing" },
        ...(current
            ? [
                  {
                      label: "Runbook changes",
                      value: diffLines({ before: current.body, after: data.body }) || "None: the runbook is the same",
                      block: current.body != data.body,
                  },
              ]
            : []),
        { label: "Runbook", value: data.body, block: true },
        { label: "Starts", value: data.enabled ? "On" : "Off" },
        {
            label: "Who gets it",
            value: data.all_bots ? "Every bot, now and new" : current ? "As it is now" : "No bot until it's given to some",
        },
    ];
}
