import {
    FileText,
    Mail,
    Receipt,
    SquarePen,
    Users,
    type LucideIcon,
} from "lucide-react";

export type DashboardShortcut = {
    title: string;
    description: string;
    url: string;
    Icon: LucideIcon;
};

export const DashboardShortcuts: DashboardShortcut[] = [
    {
        title: "Invoices",
        description: "Bill clients, track payment status and export PDFs.",
        url: "/admin/invoices",
        Icon: Receipt,
    },
    {
        title: "Quotes",
        description: "Draft priced proposals and convert them to invoices.",
        url: "/admin/quotes",
        Icon: SquarePen,
    },
    {
        title: "Letters",
        description: "Compose letterhead documents ready to print or send.",
        url: "/admin/letters",
        Icon: FileText,
    },
    {
        title: "Emails",
        description: "Write, attach and send branded email from one place.",
        url: "/admin/emails",
        Icon: Mail,
    },
    {
        title: "People",
        description: "Manage admin users, roles and access.",
        url: "/admin/people",
        Icon: Users,
    },
];
