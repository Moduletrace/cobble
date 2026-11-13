import { describe, expect, test } from "bun:test";
import repeatToolCallKey from "./repeat-tool-call-key";

const call = ({ name, arguments: args }: { name: string; arguments: string }) => ({ id: "1", name, arguments: args });

describe("repeatToolCallKey", () => {
    test("matches the same read whatever order the arguments came in", () => {
        const first = repeatToolCallKey({ call: call({ name: "read_file", arguments: `{"path":"a.md","offset":1}` }) });
        const second = repeatToolCallKey({ call: call({ name: "read_file", arguments: `{"offset":1,"path":"a.md"}` }) });

        expect(first).not.toBeNull();
        expect(second).toBe(first);
    });

    test("tells different arguments and different tools apart", () => {
        const first = repeatToolCallKey({ call: call({ name: "read_file", arguments: `{"path":"a.md"}` }) });

        expect(repeatToolCallKey({ call: call({ name: "read_file", arguments: `{"path":"b.md"}` }) })).not.toBe(first);
        expect(repeatToolCallKey({ call: call({ name: "list_files", arguments: `{"path":"a.md"}` }) })).not.toBe(first);
    });

    test("reads arguments left out as an empty object", () => {
        expect(repeatToolCallKey({ call: call({ name: "list_tasks", arguments: "" }) })).toBe("list_tasks:{}");
        expect(repeatToolCallKey({ call: call({ name: "list_tasks", arguments: "  " }) })).toBe("list_tasks:{}");
    });

    test("never repeats a tool that may write", () => {
        expect(repeatToolCallKey({ call: call({ name: "computer_bash", arguments: `{"command":"ls"}` }) })).toBeNull();
        expect(repeatToolCallKey({ call: call({ name: "write_file", arguments: `{"path":"a.md"}` }) })).toBeNull();
        expect(repeatToolCallKey({ call: call({ name: "computer_write_file", arguments: `{"path":"a.md"}` }) })).toBeNull();
    });

    test("leaves arguments it can't read alone", () => {
        expect(repeatToolCallKey({ call: call({ name: "read_file", arguments: "{nope" }) })).toBeNull();
        expect(repeatToolCallKey({ call: call({ name: "read_file", arguments: `["a.md"]` }) })).toBeNull();
    });

    test("sorts keys inside nested arguments too", () => {
        const first = repeatToolCallKey({ call: call({ name: "list_files", arguments: `{"where":{"b":1,"a":2}}` }) });
        const second = repeatToolCallKey({ call: call({ name: "list_files", arguments: `{"where":{"a":2,"b":1}}` }) });

        expect(second).toBe(first);
    });
});