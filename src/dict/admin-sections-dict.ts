/**
 * The admin sections that are live. Any other `/admin/*` path redirects to
 * `AdminHomePath`. Logs (Activity) is super admins only.
 */
export const AdminSections = [
    "/admin/bots",
    "/admin/workspaces",
    "/admin/routines",
    "/admin/files",
    "/admin/usage",
    "/admin/logs",
    "/admin/help",
    "/admin/settings",
] as const;

export const AdminHomePath = "/admin/bots";
