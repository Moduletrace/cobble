import { closingNoTextNote, replyDraftNote, replyNoTextNote } from "@/src/data/harness-prompts";

type Params = {
    /**
     * Why the run stopped: the note the loop returned with the answer it
     * didn't send.
     */
    note: string;
};

/**
 * The failure notice a run that never sent its answer leaves. The note
 * the loop returned picks the line, so an empty close is not called a lie.
 */
export default function unsentAnswerMessage({ note }: Params) {
    if (note === replyNoTextNote) {
        return `The reply ended without a message, so it wasn't sent.`;
    }

    if (note === closingNoTextNote) {
        return `The reply ended with a card and no message, so it wasn't sent.`;
    }

    if (note === replyDraftNote) {
        return `The reply ended as a draft instead of a sent message, so it wasn't sent.`;
    }

    return `The answer didn't hold up against the app's record, so it wasn't sent.`;
}