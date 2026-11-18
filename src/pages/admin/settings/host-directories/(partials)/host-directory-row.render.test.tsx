import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { HostDirectoryWithLinks } from "@/src/types";
import HostDirectoryRow from "./host-directory-row";

function directory(overrides: Partial<HostDirectoryWithLinks>): HostDirectoryWithLinks {
    return {
        id: 1,
        name: "Client sites",
        source: "/srv/client-sites",
        slug: "client-sites",
        computers: [],
        workspaces: [],
        checks: [],
        ...overrides,
    } as unknown as HostDirectoryWithLinks;
}

function render(overrides: Partial<HostDirectoryWithLinks>) {
    return renderToString(
        <HostDirectoryRow
            directory={directory(overrides)}
            computers={[]}
            workspaces={[]}
            onEdit={() => {}}
            onChanged={() => {}}
            onError={() => {}}
        />,
    );
}

/**
 * One folder on the host machine in the list: its path, every place it is
 * mounted, and what to do when it isn't mounted anywhere yet.
 */
describe("HostDirectoryRow", () => {
    test("a folder nobody mounted says so", () => {
        const html = render({});

        expect(html).toContain("Client sites");
        expect(html).toContain("/srv/client-sites");
        expect(html).toContain("Not mounted anywhere yet");
    });

    test("every place it is mounted is listed", () => {
        const html = render({
            computers: [
                {
                    id: 9,
                    host_directory_id: 1,
                    computer_id: 1,
                    access: "read-write",
                    computer_name: "Main computer",
                    check: null,
                },
            ],
            workspaces: [
                {
                    id: 8,
                    host_directory_id: 1,
                    workspace_id: 12,
                    access: "read-only",
                    workspace_name: "Moduletrace LTD",
                    computer_ids: [1],
                    checks: [],
                },
            ],
        });

        expect(html).toContain("Main computer");
        expect(html).toContain("/admin/settings/computers/1");
        expect(html).toContain("Moduletrace LTD");
        expect(html).toContain("/admin/settings/workspaces/12");
        expect(html).toContain("Read only");
        expect(html).not.toContain("Not mounted anywhere yet");
    });
});