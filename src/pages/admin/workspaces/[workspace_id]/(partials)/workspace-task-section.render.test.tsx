import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { TaskWithNames } from "@/src/types";
import WorkspaceTaskSection from "./workspace-task-section";

const wide: TaskWithNames = {
    id: 12,
    created_at: 1,
    updated_at: 2,
    workspace_id: 7,
    title: "Ship the release",
    status: "doing",
};

const intro: TaskWithNames = {
    id: 30,
    created_at: 1,
    updated_at: 2,
    bot_id: 3,
    bot_name: "A",
    title: "The intro",
    status: "done",
};

const tasks: TaskWithNames[] = [wide, intro];

describe("WorkspaceTaskSection", () => {
    test("its heading, its task count and how many are still open", () => {
        const html = renderToString(<WorkspaceTaskSection section={{ key: "wide", title: "Workspace-wide", tasks }} onOpenTask={() => {}} />);

        expect(html).toContain("Workspace-wide");
        expect(html).toContain("2 tasks, 1 open");
    });

    test("one task reads in the singular", () => {
        const html = renderToString(
            <WorkspaceTaskSection section={{ key: "bot:3", title: "Software Engineer", tasks: [intro] }} onOpenTask={() => {}} />,
        );

        expect(html).toContain("Software Engineer");
        expect(html).toContain("1 task");
        expect(html).not.toContain("1 tasks");
    });

    test("a section with nothing open says only how many it holds", () => {
        const html = renderToString(
            <WorkspaceTaskSection section={{ key: "bot:3", title: "Software Engineer", tasks: [intro] }} onOpenTask={() => {}} />,
        );

        expect(html).not.toContain(" open");
    });

    test("each task is a row of its own, its title and id in it", () => {
        const html = renderToString(<WorkspaceTaskSection section={{ key: "wide", title: "Workspace-wide", tasks }} onOpenTask={() => {}} />);

        expect(html).toContain("Ship the release");
        expect(html).toContain("#12");
        expect(html).toContain("The intro");
        expect(html).toContain("#30");
    });
});