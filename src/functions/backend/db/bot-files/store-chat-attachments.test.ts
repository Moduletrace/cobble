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
     * so a chat upload kept a second copy of its extracted text (and left
     * it behind when the upload was pruned). The text belongs only on the
     * message's own `bot-attachment` row, where a reply reads it;
     * ingestion re-reads the bytes through `extractBotFileText`.
     */
    test("never writes text_content onto the file's media row", async () => {
        const code = await source();

        expect(code).not.toContain("SET text_content");
        expect(code).not.toContain("text_content = ?");
    });

    test("still saves the bytes and queues the ingest", async () => {
        const code = await source();

        expect(code).toContain("recordBotFile(");
        expect(code).toContain("enqueueFileIngest(");
    });
});
