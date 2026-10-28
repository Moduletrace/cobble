import { describe, expect, test } from "bun:test";
import type { WorkspaceWithActivity } from "@/src/types";
import orderRailWorkspaces from "./order-rail-workspaces";

const workspaces = [1, 2, 3, 4].map((id) => ({ id, name: `W${id}` }) as WorkspaceWithActivity);

function ids(list: WorkspaceWithActivity[]) {
    return list.map((workspace) => workspace.id);
}

describe("orderRailWorkspaces", () => {
    test("the last visited workspace leads, the rest keep their order", () => {
        expect(ids(orderRailWorkspaces({ workspaces, first_id: 3 }))).toEqual([3, 1, 2, 4]);
    });

    test("unchanged without one, or when it isn't listed", () => {
        expect(ids(orderRailWorkspaces({ workspaces }))).toEqual([1, 2, 3, 4]);
        expect(ids(orderRailWorkspaces({ workspaces, first_id: null }))).toEqual([1, 2, 3, 4]);
        expect(ids(orderRailWorkspaces({ workspaces, first_id: 9 }))).toEqual([1, 2, 3, 4]);
    });
});
