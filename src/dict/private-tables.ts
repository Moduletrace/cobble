import type { TableType } from "@/src/types";

/**
 * Tables holding secrets (password hashes, pending login codes). They are
 * never reachable through the admin CRUD API, not even by super admins.
 */
export const PrivateTables: TableType[] = ["user_passwords", "sso_login_codes"];
