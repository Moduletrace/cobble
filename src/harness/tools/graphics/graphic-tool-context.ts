/**
 * What the graphic tools of one run work with: the bot, the user it works
 * for and the place, and a callback that puts a graphic on its message.
 */
export type GraphicToolContext = {
    bot_id: number | string;
    user_id: number | string;
    session_id?: number | string | null;
    workspace_id?: number | string | null;
    job_id?: number | string | null;
    /**
     * Called with a graphic's ref when the run makes or changes it, so its
     * message always shows it.
     */
    onGraphic?: (params: { ref: string }) => void;
};
