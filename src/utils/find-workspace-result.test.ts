import { describe, expect, test } from "bun:test";
import findWorkspaceResult from "./find-workspace-result";

const workspaces = [
    {
        id: 12,
        name: "Summit Lending Workspace",
        description: "Summit Lending lending site",
        system_prompt: "# Workspace\n\nLending site and articles.\n\n## Standing rules\n\nNever publish without review.",
    },
    { id: 13, name: "Beetrelle", description: "Home fragrance", system_prompt: null },
];

describe("findWorkspaceResult", () => {
    test("lists each workspace on a line", () => {
        expect(findWorkspaceResult({ workspaces })).toBe(
            "#12 Summit Lending Workspace - Summit Lending lending site\n#13 Beetrelle - Home fragrance",
        );
    });

    test("matches a word in a workspace's context", () => {
        expect(findWorkspaceResult({ workspaces, query: "standing rules" })).toBe(
            "#12 Summit Lending Workspace - Summit Lending lending site",
        );
    });

    test("reports no match", () => {
        expect(findWorkspaceResult({ workspaces, query: "nowhere" })).toBe(`No workspace matches "nowhere".`);
    });

    test("returns the context whole, as stored, after its size", () => {
        const context = workspaces[0]?.system_prompt || "";
        const answer = findWorkspaceResult({ workspaces, include_context: true, only_workspace_id: 12 });

        expect(answer).toContain(`Context, ${context.length} characters:`);
        expect(answer.endsWith(context)).toBe(true);
    });

    test("says when the context is empty", () => {
        expect(findWorkspaceResult({ workspaces, include_context: true, only_workspace_id: 13 })).toContain(
            "Context, empty.",
        );
    });

    test("asks for one workspace before returning a context", () => {
        expect(findWorkspaceResult({ workspaces, include_context: true })).toContain(
            "include_context needs one workspace",
        );
    });

    test("reports an id that isn't there", () => {
        expect(findWorkspaceResult({ workspaces, only_workspace_id: 99 })).toBe("No workspace has id 99.");
    });
});