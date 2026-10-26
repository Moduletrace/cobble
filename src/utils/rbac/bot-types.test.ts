import { describe, expect, test } from "bun:test";
import botCan from "./bot-can";
import botCanTarget from "./bot-can-target";
import botTypeAssignment from "./bot-type-assignment";
import botTypesIn from "./bot-types-in";

const admin_of_3 = [{ bot_type: "workspace_admin" as const, workspace_id: 3 }];

describe("botTypesIn", () => {
    test("a bot with no rows is a worker", () => {
        expect(botTypesIn({ bot_types: [] })).toEqual(["worker"]);
        expect(botTypesIn({ kind: "worker", bot_types: [] })).toEqual(["worker"]);
    });

    test("a workspace type only holds in its workspace", () => {
        expect(botTypesIn({ bot_types: admin_of_3, workspace_id: 3 })).toEqual(["workspace_admin"]);
        expect(botTypesIn({ bot_types: admin_of_3, workspace_id: 4 })).toEqual(["worker"]);
        expect(botTypesIn({ bot_types: admin_of_3 })).toEqual(["worker"]);
    });

    test("a type row without a workspace holds nowhere", () => {
        expect(botTypesIn({ bot_types: [{ bot_type: "workspace_admin", workspace_id: null }], workspace_id: 3 })).toEqual([
            "worker",
        ]);
    });

    test("the coordinator kind holds everywhere", () => {
        expect(botTypesIn({ kind: "coordinator", workspace_id: 9 })).toEqual(["coordinator"]);
        expect(botTypesIn({ kind: "coordinator" })).toEqual(["coordinator"]);
    });
});

describe("botCan", () => {
    test("a workspace admin delegates in its workspace only", () => {
        expect(botCan({ bot_types: admin_of_3, permission: "delegate_task", workspace_id: 3 })).toBe(true);
        expect(botCan({ bot_types: admin_of_3, permission: "delegate_task", workspace_id: 5 })).toBe(false);
        expect(botCan({ bot_types: admin_of_3, permission: "delegate_task" })).toBe(false);
    });

    test("a workspace admin doesn't manage the crew", () => {
        expect(botCan({ bot_types: admin_of_3, permission: "manage_crew", workspace_id: 3 })).toBe(false);
    });

    test("the coordinator can do everything", () => {
        expect(botCan({ kind: "coordinator", permission: "manage_extensions" })).toBe(true);
        expect(botCan({ kind: "coordinator", permission: "delegate_task", workspace_id: 3 })).toBe(true);
    });

    test("a worker can't delegate", () => {
        expect(botCan({ kind: "worker", bot_types: [], permission: "delegate_task", workspace_id: 3 })).toBe(false);
    });
});

describe("botCanTarget", () => {
    test("a workspace admin directs the workers there", () => {
        expect(botCanTarget({ actor_bot_types: admin_of_3, target_bot_types: [], workspace_id: 3 })).toBe(true);
    });

    test("a workspace admin doesn't direct another admin or the coordinator", () => {
        expect(botCanTarget({ actor_bot_types: admin_of_3, target_bot_types: admin_of_3, workspace_id: 3 })).toBe(false);
        expect(botCanTarget({ actor_bot_types: admin_of_3, target_kind: "coordinator", workspace_id: 3 })).toBe(false);
    });

    test("an admin elsewhere is a worker here", () => {
        expect(botCanTarget({ actor_bot_types: admin_of_3, target_bot_types: [], workspace_id: 4 })).toBe(false);
        expect(botCanTarget({
            actor_bot_types: admin_of_3,
            target_bot_types: [{ bot_type: "workspace_admin", workspace_id: 8 }],
            workspace_id: 3,
        })).toBe(true);
    });

    test("the coordinator directs workers and admins, never itself", () => {
        expect(botCanTarget({ actor_kind: "coordinator", target_bot_types: [], workspace_id: 3 })).toBe(true);
        expect(botCanTarget({ actor_kind: "coordinator", target_bot_types: admin_of_3, workspace_id: 3 })).toBe(true);
        expect(botCanTarget({ actor_kind: "coordinator", target_kind: "coordinator" })).toBe(false);
    });

    test("a worker directs no one", () => {
        expect(botCanTarget({ actor_bot_types: [], target_bot_types: [], workspace_id: 3 })).toBe(false);
    });
});

describe("botTypeAssignment", () => {
    const user = (...types: string[]) => types.map((user_type) => ({ user_type }));

    test("super admins and admins grant and remove workspace admin", () => {
        for (const action of ["assign", "delete"] as const) {
            expect(botTypeAssignment({ actor_user_types: user("super_admin"), target_bot_type: "workspace_admin", action })).toBe(true);
            expect(botTypeAssignment({ actor_user_types: user("admin"), target_bot_type: "workspace_admin", action })).toBe(true);
            expect(botTypeAssignment({ actor_user_types: user("member"), target_bot_type: "workspace_admin", action })).toBe(false);
        }
    });

    test("the coordinator bot grants workspace admin, a workspace admin doesn't", () => {
        expect(botTypeAssignment({ actor_bot: { kind: "coordinator" }, target_bot_type: "workspace_admin", action: "assign" })).toBe(true);
        expect(botTypeAssignment({ actor_bot: { kind: "worker", bot_types: admin_of_3 }, target_bot_type: "workspace_admin", action: "assign" })).toBe(false);
    });
});
