import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { GeneralSettingsAudience, GeneralSettingsSection } from "@/src/dict/general-settings-dict";
import canManageCrew from "./can-manage-crew";
import isPassThroughUser from "./is-pass-through-user";

type Params = {
    user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
};

const reaches = ({ audience, user_types }: Params & { audience: GeneralSettingsAudience }) => {
    if (audience == "everyone") return true;
    if (audience == "crew_manager") return canManageCrew({ user_types });

    return isPassThroughUser({ user_types });
};

/**
 * Whether the user may see a section's settings (a member sent to a limit
 * they hit reads its value, but gets no form).
 */
export function canReadGeneralSettingsSection({ section, user_types }: Params & { section: GeneralSettingsSection }) {
    return reaches({ audience: section.readable_by, user_types });
}

/**
 * Whether the user may change a section's settings: the form, and the save
 * behind it.
 */
export function canEditGeneralSettingsSection({ section, user_types }: Params & { section: GeneralSettingsSection }) {
    return reaches({ audience: section.editable_by, user_types });
}