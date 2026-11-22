import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { HostDirectoryCheckState } from "@/src/dict/host-directory-dict";
import HostDirectoryLinkRow from "./host-directory-link-row";

function render({
    state,
    access = "read-write",
    command,
    stale,
    error,
    checked_at = 1_700_000_000_000,
    onGrant,
    gate_deletes = true,
}: {
    state: HostDirectoryCheckState;
    access?: "read-write" | "read-only";
    command?: string;
    stale?: boolean;
    error?: string;
    checked_at?: number | null;
    onGrant?: () => void;
    gate_deletes?: boolean;
}) {
    return renderToString(
        <HostDirectoryLinkRow
            kind="computer"
            name="Main computer"
            href="/admin/settings/computers/1"
            access={access}
            state={state}
            checked_at={checked_at}
            command={command}
            stale={stale}
            error={error}
            gate_deletes
            onGrant={onGrant}
            onAccess={() => {}}
            onDeletes={() => {}}
            onRemove={() => {}}
        />,
    );
}

/**
 * One place a host directory is mounted: what its bots can do there, and
 * what to run on the host when they can't.
 */
describe("HostDirectoryLinkRow", () => {
    test("a checked folder shows its state and when it was checked", () => {
        const html = render({ state: "writable" });

        expect(html).toContain("Main computer");
        expect(html).toContain("/admin/settings/computers/1");
        expect(html).toContain("Computer");
        expect(html).toContain("Read and write");
        expect(html).toContain("checked");
    });

    test("a workspace wears its own picture and says it is a workspace", () => {
        const html = renderToString(
            <HostDirectoryLinkRow
                kind="workspace"
                name="Moduletrace"
                href="/admin/settings/workspaces/4"
                image_media_id={12}
                access="read-write"
                state="unknown"
                gate_deletes
                onAccess={() => {}}
                onDeletes={() => {}}
                onRemove={() => {}}
            />,
        );

        expect(html).toContain("Workspace");
        expect(html).toContain("/media/");
        expect(html).toContain("12");
    });

    test("a folder the bots can't write in shows the command to run", () => {
        const html = render({
            state: "read-only",
            command: "sudo setfacl -R -m u:100006:rwX /srv/sites",
        });

        expect(html).toContain("Cobble couldn&#x27;t give the bots access");
        expect(html).toContain("sudo setfacl -R -m u:100006:rwX /srv/sites");
    });

    test("a read-only link never asks for write access", () => {
        const html = render({ state: "read-only", access: "read-only" });

        expect(html).toContain("Read only");
        expect(html).not.toContain("The bots can&#x27;t write there yet");
        expect(html).not.toContain("Give access");
    });

    test("a check that couldn't run says why", () => {
        const html = render({
            state: "unknown",
            checked_at: null,
            error: "No such image: ghcr.io/moduletrace/cobble-computer:1.4.5",
        });

        expect(html).toContain("Couldn&#x27;t check it:");
        expect(html).toContain("No such image");
        expect(html).toContain("Not checked");
    });

    test("a bot added after the last check is said to be untested, and the way back is there when it can't write", () => {
        const html = render({
            state: "writable",
            stale: true,
            command: "sudo setfacl -R -m u:100006:rwX /srv/sites",
        });

        expect(html).toContain("A bot was added since the last check");
        expect(html).toContain("Cobble couldn&#x27;t give the bots access");
        expect(html).toContain("sudo setfacl -R -m u:100006:rwX /srv/sites");
    });

    test("a read-only link shows no command even when a bot was added since the check", () => {
        const html = render({ state: "writable", access: "read-only", stale: true });

        expect(html).toContain("A bot was added since the last check");
        expect(html).not.toContain("setfacl");
    });

    test("a link whose bots can't write keeps its check and its menu", () => {
        const html = render({ state: "partial", onGrant: () => {} });

        expect(html).toContain("Some bots can&#x27;t write");
        expect(html).toContain("Main computer menu");
    });

    test("a read-only link never offers to give access", () => {
        const html = render({
            state: "partial",
            access: "read-only",
            onGrant: () => {},
        });

        expect(html).not.toContain("Give access");
    });
});