import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    message_id: number | string;
};

/**
 * Deletes one message of a conversation, and the links it had to files:
 * the files themselves stay (they are the bot's or the user's, not the
 * message's), so this is safe for a message that shouldn't have been
 * written in the first place. Foreign keys are off outside the server, so
 * the child rows go explicitly.
 */
export default async function deleteBotMessage({ message_id }: Params) {
    await BunSQLite.sql({
        sql: `DELETE FROM bot_message_media WHERE message_id = ?`,
        values: [message_id],
    });

    /**
     * A graphic the message showed is nobody's any more: it stays readable
     * from its own page rather than pointing at a message that is gone.
     */
    await BunSQLite.sql({
        sql: `UPDATE bot_graphics SET message_id = NULL WHERE message_id = ?`,
        values: [message_id],
    }).catch(() => {});

    const res = await BunSQLite.sql({
        sql: `DELETE FROM bot_messages WHERE id = ?`,
        values: [message_id],
    });

    if (!res.success) {
        throw new Error(`Couldn't delete the message: ${res.msg || res.error}`);
    }

    return true;
}