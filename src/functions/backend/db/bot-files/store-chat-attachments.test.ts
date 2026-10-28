import { describe, expect, test } from "bun:test";

/**
 * The module's own source, since the regression it guards is what the code
 * writes to the database, not what it returns.
 */
async function source() {
    return await Bun.file(
        `${import.meta.dir}/store-chat-attachments.ts`,
    ).text();
}

describe("storeChatAttachments", () => {
    /**
     * The same text used to be copied onto the new `bot-file` media row,
     * so a chat upload kept a second copy of its extracted text. Bot files
     * keep no text at all: a bot reads the bytes when it needs them.
     */
    test("never writes text_content onto the file's media row", async () => {
        const code = await source();

        expect(code).not.toContain("SET text_content");
        expect(code).not.toContain("text_content = ?");
    });

    test("saves the bytes and indexes nothing", async () => {
        const code = await source();

        expect(code).toContain("recordBotFile(");
        expect(code).not.toContain("enqueueFileIngest(");
    });
});
