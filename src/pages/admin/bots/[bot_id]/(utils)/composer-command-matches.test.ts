import { describe, expect, test } from "bun:test";
import composerCommandMatches from "./composer-command-matches";

const names = ({ text }: { text: string }) =>
    composerCommandMatches({ text }).map((command) => command.name);

describe("composerCommandMatches", () => {
    test("a lone slash offers every command", () => {
        expect(names({ text: "/" })).toEqual(["new", "continue", "clear"]);
    });

    test("narrows by the letters typed", () => {
        expect(names({ text: "/c" })).toEqual(["continue", "clear"]);
        expect(names({ text: "/ne" })).toEqual(["new"]);
        expect(names({ text: "/new" })).toEqual(["new"]);
    });

    test("ignores the case and the space around it", () => {
        expect(names({ text: "  /NEW  " })).toEqual(["new"]);
    });

    test("an ordinary message that starts with a slash matches none", () => {
        expect(names({ text: "/etc/hosts is missing" })).toEqual([]);
        expect(names({ text: "/news" })).toEqual([]);
        expect(names({ text: "/new please" })).toEqual([]);
        expect(names({ text: "message" })).toEqual([]);
        expect(names({ text: "" })).toEqual([]);
    });
});