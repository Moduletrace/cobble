import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import userAuth from "@/src/functions/backend/auth/user-auth";
import parseComputerProxyPath from "@/src/utils/parse-computer-proxy-path";

type Params = {
    req: Request;
};

/**
 * Where a `/computers/<id>/...` request goes: the computer's own address
 * for that path, only for the computer's owner. An error response when
 * the user isn't logged in, the computer isn't theirs, or it has no
 * container.
 */
export default async function computerProxyTarget({ req }: Params) {
    const url = new URL(req.url);
    const parsed = parseComputerProxyPath({ pathname: url.pathname });

    if (!parsed) return { error: new Response("Not Found", { status: 404 }) };

    const session = await userAuth({ req });

    if (!session.user?.id) return { error: new Response("Unauthorized", { status: 401 }) };

    const computer = await grabUserComputer({
        computer_id: parsed.computer_id,
        user_id: session.user.id,
    });

    if (!computer?.id) return { error: new Response("Not Found", { status: 404 }) };

    const address = await grabComputerMcpUrl({ computer_id: computer.id });

    if (!address) {
        return { error: new Response("This computer has no container.", { status: 502 }) };
    }

    return {
        session,
        url,
        prefix: parsed.prefix,
        base_url: address.base_url,
        target: `${address.base_url}/${parsed.rest}${url.search}`,
    };
}
