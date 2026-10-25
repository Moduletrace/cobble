import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { SecretRequestView } from "@/src/types";
import SecretRequestCard from "./secret-request-card";

const token: SecretRequestView = {
    id: 4,
    key: "GITHUB_TOKEN",
    description: "GitHub personal access token with repo scope",
    reason: "To list your repositories with gh.",
    status: "pending",
    bot_id: 6,
    bot_name: "Ada",
    env_id: null,
};

function render({ view }: { view: SecretRequestView }) {
    return renderToString(<SecretRequestCard view={view} onDecided={() => {}} onDone={() => {}} />);
}

describe("SecretRequestCard", () => {
    test("asks for it in a masked input, with the bot's reason", () => {
        const html = render({ view: token });

        expect(html).toContain("GitHub personal access token with repo scope");
        expect(html).toContain("To list your repositories with gh.");
        expect(html).toContain(`type="password"`);
        expect(html).toContain(">Save<");
    });

    test("once answered, offers no input or buttons", () => {
        const saved = render({ view: { ...token, status: "saved", env_id: 9 } });

        expect(saved).not.toContain(`type="password"`);
        expect(saved).not.toContain(">Save<");
        expect(render({ view: { ...token, status: "declined" } })).toContain("Nothing was saved");
    });
});
