import {
    ArchiveRestore,
    DatabaseBackup,
    FileText,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Mail,
    Receipt,
    ScrollText,
    Settings,
    SquarePen,
    UserRound,
    Users,
    type LucideIcon,
} from "lucide-react";

export type AdminAsideLinkItem = {
    title: string;
    url: string;
    Icon: LucideIcon;
    strict?: boolean;
    super_admin_only?: boolean;
    /**
     * Only shown when `AUTH_LOGIN_METHOD` is `password`.
     */
    password_method_only?: boolean;
    /**
     * Sub pages rendered as a collapsible list under this link. With fewer
     * than two visible children the item renders as a plain link.
     */
    children?: AdminAsideLinkItem[];
};

export type AdminAsideGroup = {
    label: string;
    links: AdminAsideLinkItem[];
};

export const AdminAsideGroups: AdminAsideGroup[] = [
    {
        label: "Workspace",
        links: [
            {
                title: "Dashboard",
                url: "/admin",
                Icon: LayoutDashboard,
                strict: true,
            },
            { title: "People", url: "/admin/people", Icon: Users },
        ],
    },
    {
        label: "Documents",
        links: [
            { title: "Letters", url: "/admin/letters", Icon: FileText },
            { title: "Emails", url: "/admin/emails", Icon: Mail },
            { title: "Invoices", url: "/admin/invoices", Icon: Receipt },
            { title: "Quotes", url: "/admin/quotes", Icon: SquarePen },
        ],
    },
    {
        label: "System",
        links: [
            {
                title: "Logs",
                url: "/admin/logs",
                Icon: ScrollText,
                super_admin_only: true,
            },
            {
                title: "Backups",
                url: "/admin/backups",
                Icon: DatabaseBackup,
                super_admin_only: true,
                children: [
                    {
                        title: "Backups",
                        url: "/admin/backups",
                        Icon: DatabaseBackup,
                        strict: true,
                    },
                    {
                        title: "Restore",
                        url: "/admin/backups/restore",
                        Icon: ArchiveRestore,
                    },
                ],
            },
            {
                title: "Settings",
                url: "/admin/settings",
                Icon: Settings,
                children: [
                    {
                        title: "Profile",
                        url: "/admin/settings",
                        Icon: UserRound,
                        strict: true,
                    },
                    {
                        title: "Password",
                        url: "/admin/settings/password",
                        Icon: KeyRound,
                        password_method_only: true,
                    },
                ],
            },
            { title: "Logout", url: "/auth/logout", Icon: LogOut },
        ],
    },
];
