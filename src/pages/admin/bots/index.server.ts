import userAuth from "@/src/functions/backend/auth/user-auth";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabReachableConversation from "@/src/functions/backend/db/bot-sessions/grab-reachable-conversation";
import ensureMainComputer from "@/src/functions/backend/db/computers/ensure-main-computer";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { PagePropsType } from "@/src/types";
import crewRole from "@/src/utils/rbac/crew-role";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import readLastVisitedBot from "@/src/utils/read-last-visited-bot";

/**
 * Opens the conversation this browser was last in, from the last-visited
 * cookies the conversation pages set, while the user still reaches it.
 * Otherwise the super admin lands on the coordinator, which (with the main
 * computer) is created first if the install has none; anyone else lands on
 * the latest bot they chat with, else their first workspace; with neither,
 * the page says to ask an admin.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user, user_types } = await userAuth({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    if (crewRole({ user_types }) == "super_admin") {
        const coordinator_id = await ensureCoordinatorBot({ user_id: user.id });
        await ensureMainComputer({ user_id: user.id, coordinator_id });

        const last = await grabLastVisited({ user_id: user.id, req });

        if (last) return { redirect: { destination: last } };

        return { redirect: { destination: `/admin/bots/${coordinator_id}` } };
    }

    const last = await grabLastVisited({ user_id: user.id, req });

    if (last) return { redirect: { destination: last } };

    const [bots, workspaces] = await Promise.all([
        grabBots({ user_id: user.id }),
        grabUserWorkspaces({ user_id: user.id }),
    ]);

    if (bots[0]?.id) {
        return { redirect: { destination: `/admin/bots/${bots[0].id}` } };
    }

    if (workspaces[0]?.id) {
        return { redirect: { destination: `/admin/workspaces/${workspaces[0].id}` } };
    }

    return { props: { bots: railBots({ bots }), workspaces: railWorkspaces({ workspaces }) } };
};

/**
 * The path of the conversation this browser was last in, if the user still
 * reaches it (`grabReachableConversation`, the conversation pages' own
 * access check). Null sends the page on to its usual fallback.
 */
async function grabLastVisited({ user_id, req }: { user_id: number | string; req: Request }) {
    const visited = readLastVisitedBot({ req });

    if (!visited) return null;

    const conversation = await grabReachableConversation({
        user_id,
        bot_id: visited.bot_id,
        workspace_id: visited.workspace_id,
    });

    if (!conversation) return null;

    return conversation.workspace_id
        ? `/admin/workspaces/${conversation.workspace_id}/bots/${conversation.bot_id}`
        : `/admin/bots/${conversation.bot_id}`;
}
