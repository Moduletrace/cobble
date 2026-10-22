import BotAvatar from "@/src/components/general/bot-avatar";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseUserTypes from "@/src/utils/parse-user-types";
import UserAccessGroup from "./user-access-group";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    crew_bots: BUN_SQLITE_COBBLE_BOTS[];
    crew_workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    onUpdated: (person: BUN_SQLITE_COBBLE_USERS_JOIN) => void;
};

/**
 * The workers a user chats with and the workspaces they work in. Not for
 * super admins and admins: they reach every worker and workspace anyway.
 */
export default function UserAccessGroups({ person, crew_bots, crew_workspaces, onUpdated }: Props) {
    const user_types = parseUserTypes({ user_types: person.user_types });

    if (user_types.includes("super_admin") || user_types.includes("admin")) return null;

    return (
        <>
            <UserAccessGroup
                person={person}
                kind="bot"
                id="bots"
                title="Bots"
                description="The workers they chat with in their own chat. They reach no bot until one is added here or they're in a workspace."
                empty="No bots yet."
                items={crew_bots.map((bot) => ({
                    id: Number(bot.id),
                    name: bot.name || `Bot ${bot.id}`,
                    subtitle: bot.role,
                    href: `/admin/settings/bots/${bot.id}`,
                    avatar: (
                        <BotAvatar
                            image_media_id={bot.image_media_id}
                            {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                            face="idle"
                        />
                    ),
                }))}
                onUpdated={onUpdated}
            />
            <UserAccessGroup
                person={person}
                kind="workspace"
                id="workspaces"
                title="Workspaces"
                description="They chat with every bot in these workspaces, there."
                empty="No workspaces yet."
                items={crew_workspaces.map((workspace) => ({
                    id: Number(workspace.id),
                    name: workspace.name || `Workspace ${workspace.id}`,
                    subtitle: workspace.description,
                    href: `/admin/settings/workspaces/${workspace.id}`,
                    avatar: <WorkspaceAvatar image_media_id={workspace.image_media_id} />,
                }))}
                onUpdated={onUpdated}
            />
        </>
    );
}
