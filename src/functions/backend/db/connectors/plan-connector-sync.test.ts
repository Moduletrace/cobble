import { describe, expect, test } from "bun:test";
import planConnectorSync from "./plan-connector-sync";

type AppParams = {
    app: string;
    name?: string;
    description?: string;
    logo?: string;
    scopes?: string[] | null;
};

const app = ({ app, name = "", description = "", logo = "", scopes = null }: AppParams) => ({
    app,
    name,
    description,
    logo,
    scopes,
});

const connection = { id: 3, provider: "composio" as const, name: "Composio Work" };

describe("planConnectorSync", () => {
    test("stores an app the connection doesn't have, with a lowercase slug", () => {
        const plan = planConnectorSync({
            connection,
            apps: [app({ app: "gmail", name: "Gmail", description: "Mail", logo: "https://x/g.png", scopes: ["mail"] })],
            existing: [],
            taken: [],
        });

        expect(plan.inserts).toEqual([
            {
                provider: "composio",
                connection_id: 3,
                app: "gmail",
                name: "Gmail",
                slug: "gmail",
                description: "Mail",
                logo: "https://x/g.png",
                scopes: ["mail"],
                user_id: 0,
            },
        ]);
        expect(plan.updates).toEqual([]);
    });

    test("names the app after its connection when another one already took the slug", () => {
        const plan = planConnectorSync({
            connection,
            apps: [app({ app: "gmail", name: "Gmail" })],
            existing: [],
            taken: ["gmail"],
        });

        expect(plan.inserts[0]!.slug).toBe("gmail-composio-work");
    });

    test("two apps of the same name in one sync get different slugs", () => {
        const plan = planConnectorSync({
            connection,
            apps: [app({ app: "gmail", name: "Gmail" }), app({ app: "gmail-work", name: "Gmail" })],
            existing: [],
            taken: [],
        });

        expect(plan.inserts.map((row) => row.slug)).toEqual(["gmail", "gmail-composio-work"]);
    });

    test("an app already stored only updates when its wording moved", () => {
        const plan = planConnectorSync({
            connection,
            apps: [
                app({ app: "slack", name: "Slack", description: "Chat" }),
                app({ app: "gmail", name: "Gmail", description: "Mail" }),
            ],
            existing: [
                { app: "slack", name: "Slack", description: "Chat", logo: "" },
                { app: "gmail", name: "Gmail", description: "Old", logo: "" },
            ],
            taken: [],
        });

        expect(plan.inserts).toEqual([]);
        expect(plan.updates).toEqual([{ app: "gmail", name: "Gmail", description: "Mail", logo: "" }]);
    });

    test("falls back to the app's id for its name and stores no scopes as empty", () => {
        const plan = planConnectorSync({
            connection,
            apps: [app({ app: "stripe" })],
            existing: [],
            taken: [],
        });

        expect(plan.inserts[0]!.name).toBe("stripe");
        expect(plan.inserts[0]!.slug).toBe("stripe");
        expect(plan.inserts[0]!.scopes).toEqual([]);
        expect(plan.inserts[0]!.user_id).toBe(0);
        expect(plan.inserts[0]!.connection_id).toBe(3);
    });
});