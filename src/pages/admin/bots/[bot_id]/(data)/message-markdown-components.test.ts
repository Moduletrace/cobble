import { expect, test } from "bun:test";
import { MessageMarkdownComponents } from "./message-markdown-components";

/**
 * Its links reach the file preview, which renders through these same
 * elements: loading them first must still work (the preview merges them
 * when it renders, never at load).
 */
test("loads on its own, before the file preview", () => {
    expect(MessageMarkdownComponents.a).toBeFunction();
});
