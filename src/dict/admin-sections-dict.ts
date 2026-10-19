/**
 * The admin sections that are live. Any other `/admin/*` path redirects to
 * `AdminHomePath`. People and backups exist in code but stay closed until
 * they are added back here. Logs (Activity) is super admins only.
 */
export const AdminSections = [
    "/admin/bots",
    "/admin/workspaces",
    "/admin/routines",
    "/admin/logs",
    "/admin/help",
    "/admin/settings",
] as const;

export const AdminHomePath = "/admin/bots";
