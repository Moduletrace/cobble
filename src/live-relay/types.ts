/**
 * How far the relay has read: the newest message and job step it pushed,
 * and when it last looked for changed bots.
 */
export type LiveRelayCursor = {
    message_id: number;
    update_id: number;
    bots_at: number;
};
