import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
/**
 * Loaded first, as the app loads it: message markdown and the file preview
 * import each other, and entering at the markdown fails.
 */
import "@/src/components/general/file-preview-markdown";
import WorkspaceAboutGroup from "./workspace-about-group";

describe("WorkspaceAboutGroup", () => {
    test("shows the refs in the context as chips, not as written", () => {
        const html = renderToString(
            <WorkspaceAboutGroup
                workspace={{ id: 4, name: "Launch", system_prompt: "Ask [bot:2] first, then see [task:20]." }}
            />,
        );

        expect(html).not.toContain("[bot:2]");
        expect(html).not.toContain("[task:20]");
        expect(html).toContain("bot 2");
        expect(html).toContain("Task 20");
    });
});
