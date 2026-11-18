import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Whether the user's latest word in a conversation approves deleting the
 * paths a command named.
 *
 * A delete inside a folder mounted from the host machine waits for the
 * user (`host-directory-delete-guard`), and the approval is the user's own
 * message: the one an `ask_user` answer sends back (it carries the question
 * the bot asked, so the path is in it), or anything they typed that names
 * the path and says to go ahead. Only the newest user message counts, so an
 * approval from an earlier turn never carries to a later delete.
 */

/** Words that read as the user saying yes. */
const Affirmative = /\b(delete|remove|yes|approve[sd]?|confirm(ed)?|go ahead|do it|ok(ay)?|agreed?)\b/i;

type Params = {
    session_id: number | string;
    /**
     * The spellings of the path the user's message may name: the run's
     * own (`/home/cb-4/workspace/...`) and the real one on the computer.
     */
    needles: string[];
};

export default async function grabDeleteApproval({ session_id, needles }: Params): Promise<boolean> {
    const paths = needles.map((needle) => needle.trim()).filter(Boolean);

    if (!paths.length) return false;

    const read = await BunSQLite.sql<{ text: string }>({
        sql: `SELECT text FROM bot_messages
            WHERE session_id = ? AND author = 'user'
            ORDER BY id DESC
            LIMIT 1`,
        values: [Number(session_id)],
    });

    const text = String(read.payload?.[0]?.text || "");

    if (!text) return false;

    return Affirmative.test(text) && paths.some((needle) => text.includes(needle));
}