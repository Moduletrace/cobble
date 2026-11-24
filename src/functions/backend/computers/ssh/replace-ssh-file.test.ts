import { describe, expect, test } from "bun:test";
import replaceSshFile from "./replace-ssh-file";

type Calls = string[];

function fakeSftp({ extension, unlinkError }: { extension?: "ok" | "error" | "throw"; unlinkError?: Error }) {
    const calls: Calls = [];
    const sftp = {
        ...(extension
            ? {
                  ext_openssh_rename: (from: string, to: string, callback: (error?: Error | null) => void) => {
                      calls.push(`ext ${from} ${to}`);
                      if (extension === "throw") throw new Error("not supported");
                      callback(extension === "error" ? new Error("Failure") : null);
                  },
              }
            : {}),
        unlink: (path: string, callback: (error?: Error | null) => void) => {
            calls.push(`unlink ${path}`);
            callback(unlinkError ?? null);
        },
        rename: (from: string, to: string, callback: (error?: Error | null) => void) => {
            calls.push(`rename ${from} ${to}`);
            callback(null);
        },
    };
    return { sftp, calls };
}

describe("replaceSshFile", () => {
    test("uses posix-rename when the server has it", async () => {
        const { sftp, calls } = fakeSftp({ extension: "ok" });
        await replaceSshFile({ sftp, from: "/a.tmp", to: "/a" });
        expect(calls).toEqual(["ext /a.tmp /a"]);
    });

    test("removes the old file when posix-rename fails", async () => {
        const { sftp, calls } = fakeSftp({ extension: "error" });
        await replaceSshFile({ sftp, from: "/a.tmp", to: "/a" });
        expect(calls).toEqual(["ext /a.tmp /a", "unlink /a", "rename /a.tmp /a"]);
    });

    test("removes the old file when the extension is missing or throws", async () => {
        const missing = fakeSftp({});
        await replaceSshFile({ sftp: missing.sftp, from: "/a.tmp", to: "/a" });
        expect(missing.calls).toEqual(["unlink /a", "rename /a.tmp /a"]);

        const throwing = fakeSftp({ extension: "throw" });
        await replaceSshFile({ sftp: throwing.sftp, from: "/a.tmp", to: "/a" });
        expect(throwing.calls).toEqual(["ext /a.tmp /a", "unlink /a", "rename /a.tmp /a"]);
    });

    test("renames when there is no old file", async () => {
        const { sftp, calls } = fakeSftp({ unlinkError: Object.assign(new Error("No such file"), { code: 2 }) });
        await replaceSshFile({ sftp, from: "/a.tmp", to: "/a" });
        expect(calls).toEqual(["unlink /a", "rename /a.tmp /a"]);
    });

    test("reports a real unlink failure", async () => {
        const { sftp } = fakeSftp({ unlinkError: Object.assign(new Error("Permission denied"), { code: 3 }) });
        await expect(replaceSshFile({ sftp, from: "/a.tmp", to: "/a" })).rejects.toThrow("Permission denied");
    });
});