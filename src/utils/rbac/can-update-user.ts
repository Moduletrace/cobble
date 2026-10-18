import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";
import type { UserType } from "@/src/types";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import isPassThroughUser from "./is-pass-through-user";

type Params = {
    actor_user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
    actor_user_id?: number | string;
    target_user_id?: number | string;
    target_user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
    /**
     * The keys of the fields being updated (e.g. ["first_name", "email"]).
     * Used to restrict contact fields on protected users.
     */
    update_fields?: string[];
};

/**
 * Fields treated as contact information.
 */
export const ContactUpdateFields = ["email"];

/**
 * User types whose contact fields (email) are protected from changes by
 * non-pass-through actors.
 */
export const ContactProtectedUserTypes: UserType[] = ["super_admin"];

/**
 * Whether the actor may update a user record.
 *
 * - Any user may update their own record (profile fields only; user type
 *   changes are still governed by the assignment matrix).
 * - Pass-through actors (`super_admin`) may update anyone.
 * - `admin` may edit the basic info of any user but cannot change the
 *   email of protected users (`super_admin`). User type changes are
 *   still governed by the assignment matrix.
 * - Everyone else can only update their own record.
 */
export default function canUpdateUser({
    actor_user_types,
    actor_user_id,
    target_user_id,
    target_user_types,
    update_fields,
}: Params): boolean {
    if (
        target_user_id &&
        actor_user_id &&
        String(target_user_id) === String(actor_user_id)
    ) {
        return true;
    }

    if (isPassThroughUser({ user_types: actor_user_types })) {
        return true;
    }

    const can_edit_basic_info = checkUserAccess({
        user_types: actor_user_types,
        includes: ["admin"],
    });

    if (!can_edit_basic_info.success) {
        return false;
    }

    const touches_contacts = update_fields?.some((field) =>
        ContactUpdateFields.includes(field),
    );

    if (!touches_contacts) {
        return true;
    }

    if (
        target_user_types?.some((ut) =>
            ContactProtectedUserTypes.includes(ut.user_type as UserType),
        )
    ) {
        return false;
    }

    return true;
}