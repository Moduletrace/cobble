import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { HookProposalView } from "@/src/types";
import HookProposalCard from "./hook-proposal-card";

const pushes: HookProposalView = {
    id: 4,
    action: "create",
    hook_id: null,
    title: "GitHub pushes",
    bot_id: 6,
    bot_name: "Ada",
    status: "pending",
    expired: false,
    expires_at: Date.now() + 60 * 60 * 1000,
    outcome: "",
    result_id: null,
    makes_url: true,
    details: [
        { label: "Called by", value: "Anyone with its URL (shown to you once, when you confirm)" },
        { label: "Brief", value: "Summarise each push.", block: true },
    ],
    reason: "You asked for a summary of every push.",
};

function render({ view }: { view: HookProposalView }) {
    return renderToString(<HookProposalCard view={view} onDecided={() => {}} onDone={() => {}} />);
}

describe("HookProposalCard", () => {
    test("shows what would be saved, the bot's reason and the buttons", () => {
        const html = render({ view: pushes });

        expect(html).toContain("Summarise each push.");
        expect(html).toContain("Why (written by the bot)");
        expect(html).toContain("You asked for a summary of every push.");
        expect(html).toContain("Its URL is shown here once you confirm");
        expect(html).toContain(">Confirm<");
    });

    test("offers no buttons once it's decided or expired", () => {
        expect(render({ view: { ...pushes, status: "confirmed", outcome: "Saved as hook #2." } })).not.toContain(">Confirm<");
        expect(render({ view: { ...pushes, expired: true } })).not.toContain(">Confirm<");
    });

    test("a change says nothing about a URL", () => {
        expect(render({ view: { ...pushes, action: "change", hook_id: 2, makes_url: false } })).not.toContain("Its URL");
    });
});
