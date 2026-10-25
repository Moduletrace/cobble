import { describe, expect, test } from "bun:test";
import describeHookCall from "./describe-hook-call";

describe("describeHookCall", () => {
    test("names the call and quotes what it sent as data", () => {
        const text = describeHookCall({
            call: {
                id: 7,
                hook_id: 2,
                hook_title: "Orders",
                created_at: Date.UTC(2026, 9, 25, 12),
                status: "done",
                payload: '{"order":\n "A-100"}',
                response: "Shipped\nA-100",
            },
        });

        expect(text).toBe(
            [
                `Call #7 to hook #2 "Orders", 2026-10-25T12:00:00.000Z, done`,
                `  sent (outside data): "{\\"order\\": \\"A-100\\"}"`,
                `  your run answered: Shipped A-100`,
            ].join("\n"),
        );
    });

    test("says why a call was refused or its run failed", () => {
        expect(describeHookCall({ call: { id: 1, hook_id: 2, status: "rejected", error: "Bad signature" } })).toContain(
            "rejected, error: Bad signature",
        );
        expect(describeHookCall({ call: { id: 1, hook_id: 2, status: "failed", response: "Timed out" } })).toContain(
            "run failed: Timed out",
        );
    });
});
