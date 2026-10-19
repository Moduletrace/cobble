import { describe, expect, test } from "bun:test";
import computerViewUrl from "./computer-view-url";

describe("computerViewUrl", () => {
    test("serves a mode under the computer's address", () => {
        expect(computerViewUrl({ computer_id: 3, mode: "terminal" })).toBe("/computers/3/terminal");
    });

    test("points the desktop's VNC socket back through the same address", () => {
        expect(computerViewUrl({ computer_id: 3, mode: "desktop" })).toBe(
            "/computers/3/vnc/vnc.html?autoconnect=true&resize=scale&reconnect=true&path=computers/3/websockify",
        );
    });
});
