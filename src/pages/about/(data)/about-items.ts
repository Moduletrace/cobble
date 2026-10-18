import {
    Braces,
    Database,
    LayoutTemplate,
    Palette,
    Rocket,
    ShieldCheck,
} from "lucide-react";
import type { FeatureItem } from "@/src/types";

export const AboutItems: FeatureItem[] = [
    {
        Icon: Rocket,
        title: "Bun",
        description:
            "A fast JavaScript runtime with batteries included: bundler, tests, and package manager built in.",
    },
    {
        Icon: LayoutTemplate,
        title: "Bunext",
        description:
            "Filesystem routing and SSR on top of Bun.serve, with server-side functions beside your pages.",
    },
    {
        Icon: Database,
        title: "SQLite",
        description:
            "Schema-driven persistence with generated TypeScript types, migrations, and an admin UI.",
    },
    {
        Icon: Palette,
        title: "Tailwind v4 + twui",
        description:
            "Token-driven styling with a local, publishable component library covering layouts, forms, and editors.",
    },
    {
        Icon: ShieldCheck,
        title: "Auth & Security",
        description:
            "SSO magic links, CSRF protection, hashed credentials, and role-based admin areas included.",
    },
    {
        Icon: Braces,
        title: "TypeScript end-to-end",
        description:
            "Everything from database rows to page props is typed, with zod validation where it counts.",
    },
];
