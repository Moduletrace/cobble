import { describe, expect, test } from "bun:test";
import hostDirectoryMountsChanged, { hostDirectoryMountEntry } from "./host-directory-mounts-changed";
import type { HostDirectoryMount } from "./host-directory-mount-plan";

const mount = (overrides: Partial<HostDirectoryMount> = {}): HostDirectoryMount => ({
    host_directory_id: 1,
    source: "/srv/sites",
    slug: "sites",
    access: "read-write",
    scope: "computer",
    bot_id: 6,
    destination: "/data/computers/2/bots/6/hosts/sites",
    target: "/home/gem/workspace/bots/6/hosts/sites",
    ...overrides,
});

describe("hostDirectoryMountEntry", () => {
    test("names the source, the place and the access", () => {
        expect(hostDirectoryMountEntry({ mount: mount() })).toBe(
            "/srv/sites:/home/gem/workspace/bots/6/hosts/sites:read-write"
        );
    });
});

describe("hostDirectoryMountsChanged", () => {
    test("the same set in another order hasn't changed", () => {
        const first = mount({ bot_id: 1, destination: "/data/computers/2/bots/1/hosts/sites", target: "/home/gem/workspace/bots/1/hosts/sites" });
        const second = mount();

        expect(
            hostDirectoryMountsChanged({
                stored: [hostDirectoryMountEntry({ mount: second }), hostDirectoryMountEntry({ mount: first })],
                mounts: [first, second],
            })
        ).toBe(false);
    });

    test("a container made before any host directory matches none", () => {
        expect(hostDirectoryMountsChanged({ stored: null, mounts: [] })).toBe(false);
        expect(hostDirectoryMountsChanged({ stored: [], mounts: [] })).toBe(false);
    });

    test("one added, removed or read only instead is a change", () => {
        const entry = [hostDirectoryMountEntry({ mount: mount() })];

        expect(hostDirectoryMountsChanged({ stored: [], mounts: [mount()] })).toBe(true);
        expect(hostDirectoryMountsChanged({ stored: entry, mounts: [] })).toBe(true);
        expect(hostDirectoryMountsChanged({ stored: entry, mounts: [mount({ access: "read-only" })] })).toBe(true);
        expect(
            hostDirectoryMountsChanged({
                stored: entry,
                mounts: [mount({ bot_id: 1, destination: "/data/computers/2/bots/1/hosts/sites", target: "/home/gem/workspace/bots/1/hosts/sites" })],
            })
        ).toBe(true);
    });
});