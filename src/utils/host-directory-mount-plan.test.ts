import { describe, expect, test } from "bun:test";
import hostDirectoryMountPlan from "./host-directory-mount-plan";

const computer_dir = "/data/computers/2";

const link = {
    host_directory_id: 1,
    slug: "client-sites",
    source: "/srv/client-sites",
    access: "read-write" as const,
};

const bots = [
    { id: 1, kind: "coordinator" },
    { id: 6, kind: "worker" },
];

describe("hostDirectoryMountPlan", () => {
    test("a computer link is mounted in every bot's own folder", () => {
        const { mounts, skipped } = hostDirectoryMountPlan({
            computer_dir,
            computer_links: [link],
            workspace_links: [],
            bots,
        });

        expect(skipped).toEqual([]);
        expect(mounts).toEqual([
            {
                host_directory_id: 1,
                source: "/srv/client-sites",
                slug: "client-sites",
                access: "read-write",
                scope: "computer",
                bot_id: 1,
                destination: `${computer_dir}/bots/1/hosts/client-sites`,
                target: "/home/gem/workspace/bots/1/hosts/client-sites",
            },
            {
                host_directory_id: 1,
                source: "/srv/client-sites",
                slug: "client-sites",
                access: "read-write",
                scope: "computer",
                bot_id: 6,
                destination: `${computer_dir}/bots/6/hosts/client-sites`,
                target: "/home/gem/workspace/bots/6/hosts/client-sites",
            },
        ]);
    });

    test("a workspace link is mounted in the workspace's shared folder, once", () => {
        const { mounts } = hostDirectoryMountPlan({
            computer_dir,
            computer_links: [],
            workspace_links: [{ ...link, workspace_id: 3, access: "read-only" }],
            bots,
        });

        expect(mounts).toEqual([
            {
                host_directory_id: 1,
                source: "/srv/client-sites",
                slug: "client-sites",
                access: "read-only",
                scope: "workspace",
                workspace_id: 3,
                destination: `${computer_dir}/workspaces/3/client-sites`,
                target: "/home/gem/workspace/workspaces/3/client-sites",
            },
        ]);
    });

    test("a missing folder is skipped, never mounted", () => {
        const { mounts, skipped } = hostDirectoryMountPlan({
            computer_dir,
            computer_links: [link],
            workspace_links: [{ ...link, workspace_id: 3 }],
            bots,
            missing: [1],
        });

        expect(mounts).toEqual([]);
        expect(skipped.length).toBe(2);
        expect(skipped[0]?.reason).toContain("isn't there");
    });
});