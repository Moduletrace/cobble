import { describe, expect, test } from "bun:test";
import hostDirectoryPermissionCommand from "./host-directory-permission-command";

describe("hostDirectoryPermissionCommand", () => {
    test("every account gets an ACL entry, for the folder and for what is made in it", () => {
        expect(hostDirectoryPermissionCommand({ source: "/srv/sites", uids: [100_006, 100_002, 100_006] })).toBe(
            [
                "sudo setfacl -R -m u:100002:rwX,u:100006:rwX /srv/sites",
                "sudo find /srv/sites -type d -exec setfacl -m d:u:100002:rwX,d:u:100006:rwX {} +",
            ].join(" && ")
        );
    });

    test("nothing is chowned, chgrp'ed or chmod'ed, so the folder keeps its owner and group", () => {
        const command = hostDirectoryPermissionCommand({ source: "/srv/sites", uids: [1000, 100_004] });

        expect(command).not.toContain("chown");
        expect(command).not.toContain("chgrp");
        expect(command).not.toContain("chmod");
    });

    test("nothing to give is no command", () => {
        expect(hostDirectoryPermissionCommand({ source: "/srv/sites" })).toBe("");
        expect(hostDirectoryPermissionCommand({ source: "/srv/sites", uids: [] })).toBe("");
    });

    test("a path with a space is quoted whole", () => {
        expect(hostDirectoryPermissionCommand({ source: "/srv/client sites", uids: [1000] })).toBe(
            [
                "sudo setfacl -R -m u:1000:rwX '/srv/client sites'",
                "sudo find '/srv/client sites' -type d -exec setfacl -m d:u:1000:rwX {} +",
            ].join(" && ")
        );
    });

    test("a quote in a path can't split the command", () => {
        expect(hostDirectoryPermissionCommand({ source: "/srv/it's", uids: [1000] })).toBe(
            "sudo setfacl -R -m u:1000:rwX '/srv/it'\\''s' && sudo find '/srv/it'\\''s' -type d -exec setfacl -m d:u:1000:rwX {} +"
        );
    });
});