import { createHash } from "node:crypto";

type Params = {
    url: string;
    focus?: string;
};

/**
 * Where a run's media cache keeps an image's reading: the same image read
 * for another focus is another reading.
 *
 * The key is a SHA-256 of the url and focus, not a fast non-cryptographic
 * hash: the cache is process-wide and shared across users, so two
 * different images must never land on one key (L8). It is keyed by what
 * the image is, not by which vision model read it; a reading made by one
 * model serves another, which is the cache's point.
 */
export default function imageReadingKey({ url, focus }: Params) {
    return `image:${createHash("sha256").update(`${focus || ""}\n${url}`).digest("hex")}`;
}