import { DroppedToolImageNote } from "@/src/data/harness-prompts";
import imageReadingKey from "../media/image-reading-key";
import type { HarnessMessage } from "../types";

type Params = {
    /**
     * Changed in place, so the run keeps the savings.
     */
    transcript: HarnessMessage[];
    /**
     * How many of the newest tool images to keep.
     */
    keep: number;
    /**
     * The run's media readings (`prepareMessagesForModel`): a dropped image
     * that was read keeps its reading.
     */
    cache: Map<string, string>;
};

/**
 * Keeps a long run from resending every screenshot it took: past the
 * newest `keep` tool images, each is replaced with its reading when one was
 * made (the model worked from it), else a note. Images the user attached
 * are never dropped. Returns how many were dropped.
 */
export default function dropOldToolImages({ transcript, keep, cache }: Params) {
    const user_parts = transcript.flatMap((message) =>
        message.role == "user" && typeof message.content != "string" ? [message.content] : [],
    );
    const total = user_parts
        .flat()
        .filter((part) => part.type == "image" && part.from_tool).length;
    let to_drop = Math.max(0, total - keep);
    const dropped = to_drop;

    for (const content of user_parts) {
        for (let index = 0; index < content.length && to_drop > 0; index++) {
            const part = content[index]!;

            if (part.type != "image" || !part.from_tool) continue;

            content[index] = {
                type: "text",
                text: cache.get(imageReadingKey({ url: part.url, focus: part.focus })) || DroppedToolImageNote,
            };
            to_drop--;
        }
    }

    return dropped;
}
