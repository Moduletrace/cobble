import type { SaveSkillRequest } from "@/src/schemas/extension-schema";
import type { SkillRecord } from "@/src/types";

type Params = {
    data: SaveSkillRequest;
    /**
     * The skill as saved now. Null for a new one, where everything is new.
     */
    current: SkillRecord | null;
};

export type SkillProposalChanges = {
    /**
     * What a change would make different, in words ("name", "runbook", ...).
     * Empty when confirming it would save the skill exactly as it is.
     */
    fields: string[];
    body_changed: boolean;
    body_chars: number;
    was_body_chars: number;
};

/**
 * What saving a proposed skill would change against the saved one, so the
 * bot and the confirm outcome can say it plainly. A proposal whose runbook
 * came out the same (the bot left out `body`) reads "runbook" nowhere here.
 */
export default function skillProposalChanges({ data, current }: Params): SkillProposalChanges {
    const body_changed = !current || current.body != data.body;
    const checks = [
        { field: "name", changed: !current || current.name != data.name },
        { field: "slug", changed: !current || current.slug != data.slug },
        { field: "description", changed: !current || current.description != data.description },
        { field: "runbook", changed: body_changed },
        { field: "on/off", changed: !!current && !!current.enabled != data.enabled },
        { field: "every bot gets it", changed: !!current && data.all_bots && !current.all_bots },
    ];

    return {
        fields: checks.filter((check) => check.changed).map((check) => check.field),
        body_changed,
        body_chars: data.body.length,
        was_body_chars: current?.body.length || 0,
    };
}
