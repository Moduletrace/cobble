import { setCookies } from "@/src/utils/cookies";
import isSecureRequest from "@/src/utils/is-secure-request";
import lastVisitedBotCookies from "@/src/utils/last-visited-bot-cookies";

type Params = {
    req: Request;
    res: Response;
    bot_id: number | string;
    /**
     * Null or undefined: the bot's own chat.
     */
    workspace_id?: number | string | null;
};

/**
 * The page's response with the last-visited cookies set, so `/admin/bots`
 * opens this conversation again next time. Called from the conversation
 * pages' `res_transform`, which is why it takes and returns the response.
 */
export default function withLastVisitedBotCookies({
    req,
    res,
    bot_id,
    workspace_id,
}: Params): Response {
    const new_res = res.clone();

    setCookies(
        new_res,
        lastVisitedBotCookies({
            bot_id,
            workspace_id,
            secure: isSecureRequest({ req }),
        }),
    );

    return new_res;
}
