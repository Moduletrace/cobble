import { describe, expect, test } from "bun:test";
import guardRuleset from "./guard-ruleset";

describe("guardRuleset", () => {
    test("resets the worker uids' connections to the service ports", () => {
        const rules = guardRuleset({ uid_from: 100_001, uid_to: 9_100_000, ports: [9222, 5900, 7681, 5900] });

        expect(rules).toContain("delete table inet cobble_guard");
        expect(rules).toContain("type filter hook output priority filter; policy accept;");
        expect(rules).toContain("meta skuid 100001-9100000 tcp dport { 5900, 7681, 9222 } reject with tcp reset");
    });

    test("replaces the table whole: added, deleted, then written", () => {
        const lines = guardRuleset({ uid_from: 1, uid_to: 2, ports: [1] }).split("\n");

        expect(lines.slice(0, 3)).toEqual(["add table inet cobble_guard", "delete table inet cobble_guard", "table inet cobble_guard {"]);
    });

    test("refuses nothing to guard", () => {
        expect(() => guardRuleset({ uid_from: 1, uid_to: 2, ports: [] })).toThrow();
        expect(() => guardRuleset({ uid_from: 1, uid_to: 2, ports: [0, 70000] })).toThrow();
        expect(() => guardRuleset({ uid_from: 5, uid_to: 2, ports: [1] })).toThrow();
    });
});
