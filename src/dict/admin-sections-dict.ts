/**
 * The admin sections that are live. Any other `/admin/*` path redirects to
 * `AdminHomePath`. People, logs and backups exist in code but stay closed
 * until they are added back here.
 */
export const AdminSections = ["/admin/bots", "/admin/workspaces", "/admin/settings"] as const;

export const AdminHomePath = "/admin/bots";
