import type { HarnessTool } from "../../../types";
import requestSecretTool from "./request-secret-tool";
import showSecretTool from "./show-secret-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id?: number | string;
    workspace_id?: number | string | null;
    computer_id?: number | string | null;
    in_task?: boolean;
    /**
     * Called with a secret request's ref: the message needs the user.
     */
    onRequest?: (params: { ref: string }) => void;
    /**
     * Called with a shown secret's ref.
     */
    onShow?: (params: { ref: string }) => void;
};

/**
 * The tools that move secrets without the model seeing them: asking the
 * user for one (`request_secret`, needs a conversation to show its card
 * in) and showing one (`show_secret`). Capturing one on a computer is a
 * computer tool (`capture_secret`).
 */
export default function grabBotSecretTools({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    computer_id,
    in_task,
    onRequest,
    onShow,
}: Params): HarnessTool[] {
    return [
        ...(session_id && onRequest
            ? [requestSecretTool({ user_id, bot_id, session_id, workspace_id, in_task, onRequest })]
            : []),
        ...(onShow ? [showSecretTool({ user_id, bot_id, workspace_id, computer_id, onShow })] : []),
    ];
}
