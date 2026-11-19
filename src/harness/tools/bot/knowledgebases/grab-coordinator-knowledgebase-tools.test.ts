import { describe, expect, test } from "bun:test";
import grabCoordinatorKnowledgebaseTools from "./grab-coordinator-knowledgebase-tools";

describe("grabCoordinatorKnowledgebaseTools", () => {
    const params = { user_id: 1, bot_id: 1, workspace_id: null, computer_id: null };

    test("a watched run gets every tool", () => {
        const names = grabCoordinatorKnowledgebaseTools({ ...params, attended: true }).map((tool) => tool.name);

        expect(names).toEqual([
            "list_knowledgebases",
            "save_knowledgebase",
            "add_knowledgebase_document",
            "delete_knowledgebase_document",
            "delete_knowledgebase",
            "retry_failed_documents",
            "reindex_knowledgebase",
        ]);
    });

    test("a schedule or hook call only reads", () => {
        const names = grabCoordinatorKnowledgebaseTools({ ...params, attended: false }).map((tool) => tool.name);

        expect(names).toEqual(["list_knowledgebases"]);
    });
});