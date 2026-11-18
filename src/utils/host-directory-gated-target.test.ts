import { describe, expect, test } from "bun:test";
import gatedMountFor, { type HostDirectoryGatedMount } from "./host-directory-gated-target";

const workspace_mount: HostDirectoryGatedMount = {
    name: "Projects",
    real_target: "/home/gem/workspace/workspaces/5/projects",
    run_target: "/home/cb-4/workspace/workspaces/5/projects",
};

const computer_mount: HostDirectoryGatedMount = {
    name: "Photos",
    real_target: "/home/gem/workspace/bots/4/hosts/photos",
    run_target: "/home/cb-4/workspace/hosts/photos",
};

const mounts = [workspace_mount, computer_mount];

describe("gatedMountFor", () => {
    test("a worker's spelling of a path in a mounted folder is held", () => {
        expect(
            gatedMountFor({
                target: { path: "/home/cb-4/workspace/workspaces/5/projects/a.txt", kind: "delete" },
                mounts,
            }),
        ).toBe(workspace_mount);
    });

    test("the computer's own spelling of the same path is held too", () => {
        expect(
            gatedMountFor({
                target: { path: "/home/gem/workspace/workspaces/5/projects/a.txt", kind: "delete" },
                mounts,
            }),
        ).toBe(workspace_mount);
    });

    test("a computer link inside the bot's own folder is held", () => {
        expect(
            gatedMountFor({
                target: { path: "/home/cb-4/workspace/hosts/photos/2024/a.jpg", kind: "delete" },
                mounts,
            }),
        ).toBe(computer_mount);
    });

    test("the bot's own files are not held", () => {
        expect(
            gatedMountFor({
                target: { path: "/home/cb-4/workspace/users/1/notes.md", kind: "delete" },
                mounts,
            }),
        ).toBeNull();
    });

    test("a path that only shares a prefix with a mount is not inside it", () => {
        expect(
            gatedMountFor({
                target: { path: "/home/cb-4/workspace/workspaces/5/projects-old/a.txt", kind: "delete" },
                mounts,
            }),
        ).toBeNull();
    });

    test("a move inside the same folder is a rename, so nothing leaves the host", () => {
        expect(
            gatedMountFor({
                target: {
                    path: "/home/cb-4/workspace/workspaces/5/projects/a.txt",
                    kind: "move",
                    destination: "/home/cb-4/workspace/workspaces/5/projects/archive/a.txt",
                },
                mounts,
            }),
        ).toBeNull();
    });

    test("a move out of the folder is held", () => {
        expect(
            gatedMountFor({
                target: {
                    path: "/home/cb-4/workspace/workspaces/5/projects/a.txt",
                    kind: "move",
                    destination: "/home/cb-4/workspace/users/1/a.txt",
                },
                mounts,
            }),
        ).toBe(workspace_mount);
    });

    test("a move from one mounted folder into another is held", () => {
        expect(
            gatedMountFor({
                target: {
                    path: "/home/cb-4/workspace/hosts/photos/a.jpg",
                    kind: "move",
                    destination: "/home/cb-4/workspace/workspaces/5/projects/a.jpg",
                },
                mounts,
            }),
        ).toBe(computer_mount);
    });
});