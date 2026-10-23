import { AppData } from "@/src/data/app-data";
import pruneMediaTextContent from "@/src/functions/backend/db/media/prune-media-text-content";

/**
 * Cleans the `media.text_content` that should never have been stored.
 *
 * Before the extractor had an allowlist, every non-image/audio/video file
 * was decoded as UTF-8 and its bytes were written to `text_content`: an
 * SVG, a zip, a spreadsheet and an unknown binary all left raw (garbled)
 * content in the database. Nothing capped the length either, so a large
 * document could leave megabytes of text behind.
 *
 * Safe to rerun: it only writes a row whose text has to change.
 *
 * `bun src/scripts/prune-media-text-content.ts`
 */
async function main() {
    const result = await pruneMediaTextContent();

    for (const change of result.changes) {
        console.log(
            change.after_chars === 0
                ? `Media ${change.media_id} (${change.name}): dropped ${change.before_chars} characters.`
                : `Media ${change.media_id} (${change.name}): cut ${change.before_chars} characters to ${change.after_chars}.`,
        );
    }

    console.log(
        `Done: ${result.cleared} row(s) cleared, ${result.truncated} truncated, about ${Math.round(result.reclaimed_bytes / 1024)} KB reclaimed from ${result.checked} row(s) with text.`,
    );

    if (result.reclaimed_bytes > 0) {
        console.log(
            `The freed space stays in the database file until it is vacuumed: run "bunx bun-sqlite vacuum" (or restore from a fresh backup) to reclaim it on disk. Kept text is capped at AppData.BotAttachmentTextStoreMaxChars (${AppData.BotAttachmentTextStoreMaxChars}).`,
        );
    }
}

await main();
process.exit(0);
