import { describe, expect, test } from "bun:test";
import { parseComputerDirectory } from "./list-computer-directory";

function field({ type, name, size = 0, modified = 0 }: { type: string; name: string; size?: number; modified?: number }) {
    return `${type}\0${name}\0${size}\0${modified}\0`;
}

describe("parseComputerDirectory", () => {
    test("reads a folder and a file, with its size and time", () => {
        const output = field({ type: "d", name: "users", modified: 1763000000 }) +
            field({ type: "f", name: "browser-tabs.md", size: 512, modified: 1763000000.75 });

        expect(parseComputerDirectory({ output })).toEqual([
            { name: "users", kind: "folder", size: 0, modified_at: 1763000000000 },
            { name: "browser-tabs.md", kind: "file", size: 512, modified_at: 1763000000750 },
        ]);
    });

    test("leaves out anything but a folder or a file", () => {
        const output = field({ type: "l", name: "escape" }) +
            field({ type: "s", name: "socket" }) +
            field({ type: "f", name: "kept.md", size: 1 });

        expect(parseComputerDirectory({ output }).map((entry) => entry.name)).toEqual(["kept.md"]);
    });

    test("drops a last entry the answer was cut off in", () => {
        const output = field({ type: "f", name: "kept.md", size: 1 }) + "f\0cut-off\0";

        expect(parseComputerDirectory({ output }).map((entry) => entry.name)).toEqual(["kept.md"]);
    });

    test("reads nothing from an empty answer", () => {
        expect(parseComputerDirectory({ output: "" })).toEqual([]);
    });
});