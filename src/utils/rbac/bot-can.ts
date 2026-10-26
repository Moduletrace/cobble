import { BotTypePermissionMatrix } from "@/src/dict/bot-types-dict";
import type { BotKind } from "@/src/dict/bot-dict";
import type { BotPermission } from "@/src/types";
import botTypesIn, { type BotTypeRow } from "./bot-types-in";

type Params = {
    kind?: BotKind | "" | null;
    bot_types?: BotTypeRow[] | null;
    permission: BotPermission;
    /**
     * Where the bot is working: its own chat (null) or a workspace. A
     * workspace type only counts there.
     */
    workspace_id?: number | string | null;
};

/**
 * Whether a bot's kind and types let it do `permission` where it's working
 * (`BotTypePermissionMatrix`). This is the bot's side only: the user the
 * run works for must still be allowed to do it.
 */
export default function botCan({ kind, bot_types, permission, workspace_id }: Params): boolean {
    return botTypesIn({ kind, bot_types, workspace_id }).some((bt) =>
        BotTypePermissionMatrix[bt].includes(permission),
    );
}
