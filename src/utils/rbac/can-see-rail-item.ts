import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

type Params = {
    item: {
        /**
         * Who sees it, when that's an RBAC rule rather than super admins only.
         */
        can_view?: (params: {
            user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
        }) => boolean;
        super_admin_only?: boolean;
    };
    is_super_admin: boolean;
    user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
};

/**
 * Whether a rail destination (a settings sub page, a popover page) shows
 * to this user: its own RBAC rule when it has one, else super admins only
 * when it's a super admin page, else everyone.
 *
 * Shared by the rail lists and the user popover, so a page gated in one is
 * never offered in the other.
 */
export default function canSeeRailItem({ item, is_super_admin, user_types }: Params): boolean {
    if (item.can_view) return item.can_view({ user_types });

    return is_super_admin || !item.super_admin_only;
}
