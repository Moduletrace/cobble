import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import { ComposerCommands, type ComposerCommand } from "../(data)/composer-commands";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";

type Params = {
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    bot_kind?: string | null;
    workspace_id?: number | null;
};

/**
 * The commands this user gets in this conversation, with exactly the gates
 * the header menu puts on its rows: hooks start work, so a read-only user
 * doesn't get them; instructions are per workspace and crew managers only;
 * settings follow the menu (the coordinator's page only for pass-through
 * actors, a worker's for crew managers).
 */
export default function visibleComposerCommands({
    user_types,
    bot_kind,
    workspace_id,
}: Params): ComposerCommand[] {
    const can_make_hooks = !isReadOnlyUser({ user_types });
    const can_edit_here = Boolean(workspace_id && canManageCrew({ user_types }));
    const can_open_settings =
        bot_kind == "coordinator"
            ? isPassThroughUser({ user_types })
            : canManageCrew({ user_types });

    return ComposerCommands.filter((command) => {
        if (command.name == "hooks") return can_make_hooks;
        if (command.name == "instructions") return can_edit_here;
        if (command.name == "settings") return can_open_settings;

        return true;
    });
}
