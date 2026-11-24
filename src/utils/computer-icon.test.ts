import { describe, expect, test } from "bun:test";
import { Monitor, Server } from "lucide-react";
import computerIcon from "./computer-icon";

describe("computerIcon", () => {
    test("a container wears a monitor, an SSH machine a server", () => {
        expect(computerIcon({ connection: "docker" })).toBe(Monitor);
        expect(computerIcon({ connection: null })).toBe(Monitor);
        expect(computerIcon({ connection: "ssh" })).toBe(Server);
    });
});