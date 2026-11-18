import { describe, expect, test } from "bun:test";
import hostDirectoryGrantArgs, {
    HostDirectoryGrantScript,
} from "./host-directory-grant-args";

describe("hostDirectoryGrantArgs", () => {
    test("says nothing when no account changes", () => {
        expect(hostDirectoryGrantArgs({})).toEqual([]);
    });

    test("adds each account once, sorted, whatever order they came in", () => {
        expect(
            hostDirectoryGrantArgs({ added: [100012, 100004, 100012, 1000] }),
        ).toEqual(["add:1000", "add:100004", "add:100012"]);
    });

    test("takes access away from the accounts that lost it", () => {
        expect(
            hostDirectoryGrantArgs({ removed: [100009, 100004] }),
        ).toEqual(["remove:100004", "remove:100009"]);
    });

    test("gives access to an account that both lost and gained it", () => {
        expect(
            hostDirectoryGrantArgs({ added: [100004], removed: [100004] }),
        ).toEqual(["add:100004"]);
    });
});

describe("HostDirectoryGrantScript", () => {
    test("gives and takes access with ACL entries, leaving ownership alone", () => {
        expect(HostDirectoryGrantScript).toContain(`setfacl -R -m "u:$uid:rwX"`);
        expect(HostDirectoryGrantScript).toContain(`setfacl -R -x "u:$uid"`);
        expect(HostDirectoryGrantScript).toContain(`setfacl -m "d:u:$uid:rwX"`);
        expect(HostDirectoryGrantScript).not.toContain("chown");
        expect(HostDirectoryGrantScript).not.toContain("chmod");
        expect(HostDirectoryGrantScript).not.toContain("chgrp");
    });
});