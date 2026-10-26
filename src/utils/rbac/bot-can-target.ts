import type { BotKind } from "@/src/dict/bot-dict";
import { BotTypeTargetMatrix } from "@/src/dict/bot-types-dict";
import botTypesIn, { type BotTypeRow } from "./bot-types-in";
import typeAssignment from "./type-assignment";

type Params = {
    actor_kind?: BotKind | "" | null;
    actor_bot_types?: BotTypeRow[] | null;
    target_kind?: BotKind | "" | null;
    target_bot_types?: BotTypeRow[] | null;
    /**
     * Where they're working: types count there.
     */
    workspace_id?: number | string | null;
};

/**
 * Whether a bot may act on another (hand it a task, set its instructions)
 * where they're working, through `BotTypeTargetMatrix`: the coordinator
 * acts on anyone, a workspace admin on the workers there.
 */
export default function botCanTarget({
    actor_kind,
    actor_bot_types,
    target_kind,
    target_bot_types,
    workspace_id,
}: Params): boolean {
    const actor_types = botTypesIn({ kind: actor_kind, bot_types: actor_bot_types, workspace_id });
    const target_types = botTypesIn({ kind: target_kind, bot_types: target_bot_types, workspace_id });

    return typeAssignment({
        actor_types,
        pass_through: actor_types.includes("coordinator") && !target_types.includes("coordinator"),
        target_type: target_types[0] || "worker",
        target_types,
        action: "assign",
        assignment_matrix: BotTypeTargetMatrix,
        deletion_matrix: BotTypeTargetMatrix,
        label: "Bot RBAC",
    });
}
