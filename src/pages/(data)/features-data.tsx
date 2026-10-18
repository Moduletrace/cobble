import {
    Database,
    LayoutTemplate,
    Palette,
    Rocket,
    ShieldCheck,
    Workflow,
} from "lucide-react";
import type { FeatureItem } from "@/src/types";

export const FeaturesArray: FeatureItem[] = [
    {
        Icon: Rocket,
        title: "Instant Start",
        description:
            "Zero-config Bun server with hot reload out of the box. Run bun run dev and ship on day one.",
    },
    {
        Icon: Database,
        title: "SQLite Out of the Box",
        description:
            "Schema-driven SQLite with generated types, migrations, backups, and an admin UI included.",
    },
    {
        Icon: LayoutTemplate,
        title: "Filesystem Routing",
        description:
            "Route files under src/pages with dynamic [params] and catch-all routes. No routing config to maintain.",
    },
    {
        Icon: ShieldCheck,
        title: "Auth & SSO Ready",
        description:
            "Magic-link SSO, CSRF protection, secure cookies, and role-gated admin areas wired up and working.",
    },
    {
        Icon: Workflow,
        title: "Server Functions",
        description:
            "Co-locate server logic in index.server.ts beside your pages for type-safe, tidy full-stack code.",
    },
    {
        Icon: Palette,
        title: "twui Design System",
        description:
            "A local, publishable component library of layouts, elements, forms and editors, styled with Tailwind v4 tokens.",
    },
];