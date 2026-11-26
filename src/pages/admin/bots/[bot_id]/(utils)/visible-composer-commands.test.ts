import { describe, expect, test } from "bun:test";
import visibleComposerCommands from "./visible-composer-commands";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

const as = (...user_types: string[]) =>
    user_types.map((user_type) => ({ user_type })) as BUN_SQLITE_COBBLE_USER_TYPES[];

const names = (params: Parameters<typeof visibleComposerCommands>[0]) =>
    visibleComposerCommands(params).map((command) => command.name);

const held = ({
    params,
    name,
}: {
    params: Parameters<typeof visibleComposerCommands>[0];
    name: string;
}) => names(params).includes(name);

describe("visibleComposerCommands", () => {
    test("the session trio and the plain views are for everyone", () => {
        const member = {
            user_types: as("member"),
            bot_kind: "worker" as const,
        };

        for (const name of [
            "new",
            "continue",
            "clear",
            "sessions",
            "files",
            "tasks",
            "routines",
            "computers",
            "models",
            "panel",
            "copy",
            "stop",
        ]) {
            expect(held({ params: member, name })).toBe(true);
        }
    });

    test("a read-only user does not get the hooks that wake a bot", () => {
        expect(
            held({
                params: {
                    user_types: as("read_only"),
                    bot_kind: "worker",
                },
                name: "hooks",
            }),
        ).toBe(false);
        expect(
            held({
                params: { user_types: as("member"), bot_kind: "worker" },
                name: "hooks",
            }),
        ).toBe(true);
    });

    test("instructions need a workspace and a crew manager", () => {
        expect(
            held({
                params: {
                    user_types: as("member"),
                    bot_kind: "worker",
                    workspace_id: 4,
                },
                name: "instructions",
            }),
        ).toBe(false);
        expect(
            held({
                params: {
                    user_types: as("admin"),
                    bot_kind: "worker",
                    workspace_id: null,
                },
                name: "instructions",
            }),
        ).toBe(false);
        expect(
            held({
                params: {
                    user_types: as("admin"),
                    bot_kind: "worker",
                    workspace_id: 4,
                },
                name: "instructions",
            }),
        ).toBe(true);
    });

    test("a member gets no settings on either kind of bot", () => {
        expect(
            held({
                params: { user_types: as("member"), bot_kind: "worker" },
                name: "settings",
            }),
        ).toBe(false);
        expect(
            held({
                params: { user_types: as("member"), bot_kind: "coordinator" },
                name: "settings",
            }),
        ).toBe(false);
    });

    test("the coordinator's settings follow the menu: pass-through only", () => {
        expect(
            held({
                params: { user_types: as("admin"), bot_kind: "coordinator" },
                name: "settings",
            }),
        ).toBe(false);
        expect(
            held({
                params: {
                    user_types: as("super_admin"),
                    bot_kind: "coordinator",
                },
                name: "settings",
            }),
        ).toBe(true);
    });

    test("a worker's settings are for crew managers", () => {
        expect(
            held({
                params: { user_types: as("admin"), bot_kind: "worker" },
                name: "settings",
            }),
        ).toBe(true);
    });

    test("no user types at all is treated as a member", () => {
        const listed = names({ user_types: null, bot_kind: "worker" });

        expect(listed).not.toContain("settings");
        expect(listed).not.toContain("instructions");
        expect(listed).toContain("hooks");
    });
});
