import { createHash } from "node:crypto";

/**
 * Where a run's media cache keeps an audio clip's transcript: a SHA-256 of
 * the clip's bytes, for the same reason as the image key - the cache is
 * process-wide and shared across users, so two clips must never land on
 * one key (L8).
 */
export default function audioReadingKey({ data }: { data: string }) {
    return `audio:${createHash("sha256").update(data).digest("hex")}`;
}