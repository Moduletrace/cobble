import { describe, expect, test } from "bun:test";
import composerCommandMatches from "./composer-command-matches";
import { ComposerCommands, type ComposerCommand } from "../(data)/composer-commands";

const names = ({
    text,
    commands,
}: {
    text: string;
    commands?: ComposerCommand[];
}) => composerCommandMatches({ text, commands }).map((command) => command.name);

describe("composerCommandMatches", () => {
    test("a lone slash offers every command, in the registry's order", () => {
        expect(names({ text: "/" })).toEqual(
            ComposerCommands.map((command) => command.name),
        );
    });

    test("narrows by the letters typed", () => {
        expect(names({ text: "/c" })).toEqual([
            "continue",
            "clear",
            "computers",
            "copy",
        ]);
        expect(names({ text: "/s" })).toEqual(["sessions", "stop", "settings"]);
        expect(names({ text: "/ne" })).toEqual(["new"]);
        expect(names({ text: "/new" })).toEqual(["new"]);
    });

    test("only the commands the caller says this user gets", () => {
        const session_trio = ComposerCommands.slice(0, 3);

        expect(names({ text: "/", commands: session_trio })).toEqual([
            "new",
            "continue",
            "clear",
        ]);
        expect(names({ text: "/c", commands: session_trio })).toEqual([
            "continue",
            "clear",
        ]);
        expect(names({ text: "/hooks", commands: session_trio })).toEqual([]);
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
