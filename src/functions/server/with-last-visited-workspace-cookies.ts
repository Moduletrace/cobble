import { setCookies } from "@/src/utils/cookies";
import isSecureRequest from "@/src/utils/is-secure-request";
import lastVisitedWorkspaceCookies from "@/src/utils/last-visited-workspace-cookies";

type Params = {
    req: Request;
    res: Response;
    workspace_id: number | string;
};

/**
 * The page's response with the last-visited workspace cookie set, so the
 * rail lists this workspace first from the next page on. Called from the
 * workspace pages' `res_transform`.
 */
export default function withLastVisitedWorkspaceCookies({ req, res, workspace_id }: Params): Response {
    const new_res = res.clone();

    setCookies(
        new_res,
        lastVisitedWorkspaceCookies({
            workspace_id,
            secure: isSecureRequest({ req }),
        }),
    );

    return new_res;
}
