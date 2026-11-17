type Params = {
    /**
     * The failure notice the user would retry, read as it is.
     */
    message?: {
        author?: string | null;
        failed_job_id?: number | string | null;
    } | null;
    /**
     * The failed job's kind; none when the job was pruned.
     */
    job_kind?: string | null;
    /**
     * The session's status.
     */
    session_status?: string | null;
    /**
     * A reply job still pending or working in the session, if any.
     */
    open_reply_id?: number | string | null;
    /**
     * The session's newest user message, if any.
     */
    latest_user_id?: number | string | null;
    /**
     * The newest user message a reply already answered, if any.
     */
    answered_id?: number | string | null;
};

/**
 * Why a failed reply can't be retried, or null when it can. Only a reply
 * job's failure notice in the session's active conversation is retryable,
 * and only while no reply is on its way and the newest user message is
 * still unanswered: a retry answers that message again, it never starts
 * work of its own.
 */
export default function retryReplyProblem({
    message,
    job_kind,
    session_status,
    open_reply_id,
    latest_user_id,
    answered_id,
}: Params): string | null {
    if (message?.author != "bot" || !message.failed_job_id) {
        return `Only a failed reply can be retried.`;
    }

    if (job_kind != "reply") {
        return `Only a failed reply can be retried.`;
    }

    if (session_status != "active") {
        return `This conversation has moved on.`;
    }

    if (open_reply_id) {
        return `A reply is already on its way.`;
    }

    if (!latest_user_id) {
        return `There is nothing to reply to.`;
    }

    if (answered_id && Number(answered_id) >= Number(latest_user_id)) {
        return `The latest message has already been answered.`;
    }

    return null;
}
