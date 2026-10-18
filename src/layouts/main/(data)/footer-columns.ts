export type FooterColumnLink = {
    title: string;
    url: string;
};

export type FooterColumn = {
    label: string;
    links: FooterColumnLink[];
};

export const FooterColumns: FooterColumn[] = [
    {
        label: "Product",
        links: [
            { title: "Features", url: "/#features" },
            { title: "About", url: "/about" },
            { title: "Contact", url: "/contact" },
            { title: "Log in", url: "/auth/login" },
        ],
    },
    {
        label: "Legal",
        links: [
            { title: "Terms and Conditions", url: "/terms" },
            { title: "Privacy Policy", url: "/privacy" },
        ],
    },
];
