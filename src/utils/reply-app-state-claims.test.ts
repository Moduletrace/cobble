import { describe, expect, test } from "bun:test";
import replyAppStateClaims from "./reply-app-state-claims";

/**
 * The reply that started all of this (production, Nov 2026): every image call
 * had failed with "HTTP 404", and the bot explained the failure with a model
 * and a routing nobody had configured.
 */
const invented = [
    "That's what the **OpenRouter routing** is resolving to.",
    "The `model` parameter gets sent as google/nano-banana-2.1, so the tool cannot see that name.",
    "The call is being routed through OpenRouter again.",
    "Which model the tool picks is not something you set.",
];

describe("replyAppStateClaims", () => {
    test("reads an invented routing or model claim", () => {
        for (const text of invented) {
            expect(replyAppStateClaims({ text })).toContain("routing");
        }
    });

    test("reads a run claimed as killed or stopped", () => {
        expect(replyAppStateClaims({ text: "Killed the run." })).toContain("stopped_run");
        expect(replyAppStateClaims({ text: "I stopped the job before it could finish." })).toContain("stopped_run");
        expect(replyAppStateClaims({ text: "The job has been cancelled." })).toContain("stopped_run");
    });

    test("reads the rest described as unlimited or restart-only", () => {
        expect(
            replyAppStateClaims({
                text: "The image models are benched (unlimited rest-after-failure setting, only a super-admin or app restart can recover them).",
            }),
        ).toContain("rest");
        expect(replyAppStateClaims({ text: "An unlimited cooldown is in place." })).toContain("rest");
    });

    test("a model quoted with its provider is not a routing claim", () => {
        expect(
            replyAppStateClaims({ text: "qwen-image-3.0-pro on Alibaba Cloud Token Plan: HTTP 404" }),
        ).toEqual([]);
    });

    test("crew routing, the user's Stop and the app's own rest wording are left alone", () => {
        for (const text of [
            "That request is routed to the coordinator, who approves it.",
            "I couldn't stop it. Use Stop in the thread if you want it to end.",
            "They stay benched until the run limits change or the app restarts.",
            "Your load balancer routes traffic through the proxy.",
        ]) {
            expect(replyAppStateClaims({ text })).toEqual([]);
        }
    });
});