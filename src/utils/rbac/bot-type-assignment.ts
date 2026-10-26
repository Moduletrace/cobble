import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { BotKind } from "@/src/dict/bot-dict";
import { BotTypeAssignmentMatrix, BotTypeDeletionMatrix } from "@/src/dict/bot-types-dict";
import type { BotType } from "@/src/types";
import botTypesIn, { type BotTypeRow } from "./bot-types-in";
import isPassThroughUser from "./is-pass-through-user";
import typeAssignment from "./type-assignment";

type Params = {
    /**
     * A user granting it: their user types (the super admin passes
     * through).
     */
    actor_user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
    /**
     * A bot granting it from chat: its kind and types. Only its kind counts
     * (no workspace), so a workspace admin never grants types.
     */
    actor_bot?: {
        kind?: BotKind | "" | null;
        bot_types?: BotTypeRow[] | null;
    } | null;
    target_bot_type: BotType;
    action: "assign" | "delete";
};

/**
 * Whether a user, or a bot, may grant or remove `target_bot_type`
 * (`BotTypeAssignmentMatrix`, `BotTypeDeletionMatrix`). A bot acting for a
 * user needs both: call it once for the bot and once for the user.
 */
export default function botTypeAssignment({
    actor_user_types,
    actor_bot,
    target_bot_type,
    action,
}: Params): boolean {
    const actor_types = actor_bot
        ? botTypesIn({ kind: actor_bot.kind, bot_types: actor_bot.bot_types })
        : (actor_user_types || []).map((ut) => ut.user_type).filter((ut): ut is string => Boolean(ut));

    return typeAssignment({
        actor_types,
        pass_through: actor_bot ? false : isPassThroughUser({ user_types: actor_user_types as never }),
        target_type: target_bot_type,
        action,
        assignment_matrix: BotTypeAssignmentMatrix,
        deletion_matrix: BotTypeDeletionMatrix,
        label: "Bot RBAC",
    });
}
