import type { Server } from "bun";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isSameOriginUpgrade from "@/src/utils/is-same-origin-upgrade";
import type { WebSocketSession } from "@/src/websocket/types";

type Params = {
    req: Request;
    server: Server<WebSocketSession>;
};

const path = /^\/computers\/(\d+)\/ssh-terminal\/?$/;

/**
 * The authentication for an SSH computer's terminal websocket: a crew
 * manager reaches a computer they can see, over SSH.
 */
export default async function handleSshTerminal({
    req,
    server,
}: Params): Promise<Response | undefined> {
    if (!isSameOriginUpgrade({ req })) {
        return new Response("Forbidden", { status: 403 });
    }

    const session = await userAuth({ req });

    if (!session.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!canManageCrew({ user_types: session.user_types })) {
        return new Response("Forbidden", { status: 403 });
    }

    const computer_id = Number(path.exec(new URL(req.url).pathname)?.[1] || 0);
    const computer = computer_id
        ? await grabUserComputer({ computer_id, user_id: session.user.id })
        : null;

    if (!computer || computer.connection != "ssh") {
        return new Response("Not Found", { status: 404 });
    }

    const upgraded = server.upgrade(req, {
        data: {
            user: session.user,
            user_types: session.user_types ?? [],
            ssh_terminal: { computer_id },
        } satisfies WebSocketSession,
    });

    if (!upgraded) {
        return new Response("Upgrade failed", { status: 400 });
    }
}