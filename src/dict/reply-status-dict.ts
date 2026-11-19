/**
 * What a reply declares about its own end. `done` means nothing is running
 * once the message goes out, `working` means a run carries the work on and
 * its result will be posted here, and `blocked` means the work cannot go on
 * and the message says why. `send_reply` carries it, and the review reads it
 * against the app's record: a `done` message that says work is under way is
 * a contradiction, and a `working` one needs a run that is really open.
 */
export const ReplyStatuses = ["done", "working", "blocked"] as const;

export type ReplyStatus = (typeof ReplyStatuses)[number];