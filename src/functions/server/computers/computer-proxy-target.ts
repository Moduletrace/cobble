import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import userAuth from "@/src/functions/backend/auth/user-auth";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import computerProxyPathAllowed from "@/src/utils/computer-proxy-path-allowed";
import parseComputerProxyPath from "@/src/utils/parse-computer-proxy-path";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Params = {
    req: Request;
};

/**
 * Where a `/computers/<id>/...` request goes: the computer's own address
 * for that path, only for a user who reaches the computer and only for a
 * view they may open (`computerProxyPathAllowed`: the live view, and the
 * shell for crew managers; never the agent's API or Playwright MCP). An
 * error response when the user isn't logged in, the computer or path
 * isn't theirs, it has no container, or it isn't ready.
 */
export default async function computerProxyTarget({ req }: Params) {
    const url = new URL(req.url);
    const parsed = parseComputerProxyPath({ pathname: url.pathname });

    if (!parsed) return { error: new Response("Not Found", { status: 404 }) };

    const session = await userAuth({ req });

    if (!session.user?.id) return { error: new Response("Unauthorized", { status: 401 }) };

    if (!computerProxyPathAllowed({ rest: parsed.rest, can_manage_crew: canManageCrew({ user_types: session.user_types || [] }) })) {
        return { error: new Response("Not Found", { status: 404 }) };
    }

    const computer = await grabUserComputer({
        computer_id: parsed.computer_id,
        user_id: session.user.id,
    });

    if (!computer?.id) return { error: new Response("Not Found", { status: 404 }) };

    const address = await grabComputerMcpUrl({ computer_id: computer.id });

    if (!address) {
        return { error: new Response("This computer has no container.", { status: 502 }) };
    }

    if (!address.ready) {
        return { error: new Response(computerNotReadyMessage(address), { status: 503 }) };
    }

    return {
        session,
        url,
        prefix: parsed.prefix,
        base_url: address.base_url,
        token: address.token,
        target: `${address.base_url}/${parsed.rest}${url.search}`,
    };
}
