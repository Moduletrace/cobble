import { describe, expect, test } from "bun:test";
import takeOverRef from "@/src/utils/take-over-ref";
import withTakeOverRefs from "./with-take-over-refs";

const ref = takeOverRef({ id: 1, mode: "browser" });

describe("withTakeOverRefs", () => {
    test("adds a take-over the bot didn't write, once", () => {
        expect(withTakeOverRefs({ text: "Please log in to Gmail.", refs: [ref, ref] })).toEqual({
            result: `Please log in to Gmail.\n\n${ref}`,
            needs_you: true,
        });
    });

    test("keeps one the bot wrote itself", () => {
        const text = `Log in here: ${ref}`;

        expect(withTakeOverRefs({ text, refs: [ref] })).toEqual({ result: text, needs_you: true });
    });

    test("leaves a message without a take-over alone", () => {
        expect(withTakeOverRefs({ text: "Done.", refs: [] })).toEqual({ result: "Done.", needs_you: false });
    });
});
