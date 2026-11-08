import { describe, expect, test } from "bun:test";
import messageTooLongMessage from "./message-too-long-message";

describe("messageTooLongMessage", () => {
    test("names the limit and how far over the message is", () => {
        const text = messageTooLongMessage({ length: 21500, max_chars: 20000 });

        expect(text).toContain("up to 20,000 characters");
        expect(text).toContain("1,500 over");
    });

    test("never says zero over", () => {
        expect(messageTooLongMessage({ length: 100, max_chars: 100 })).toContain("1 over");
    });
});
