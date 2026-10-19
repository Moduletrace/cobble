import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import UserAvatar from "@/src/components/general/user-avatar";
import { UserTypes } from "@/src/dict/user-types-dict";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseIdList from "@/src/utils/parse-id-list";
import parseUserTypes from "@/src/utils/parse-user-types";
import SettingsGroup from "../../../(partials)/settings-group";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    /**
     * The session user, to say "You".
     */
    actor_user_id?: number | string;
    /**
     * Workers and workspaces a member reaches.
     */
    crew_bots: BUN_SQLITE_COBBLE_BOTS[];
    crew_workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

/**
 * A user at a glance: their photo, name, contact details, user types and
 * what they reach.
 */
export default function UserOverviewGroup({
    person,
    actor_user_id,
    crew_bots,
    crew_workspaces,
}: Props) {
    const name =
        [person.first_name, person.last_name].filter(Boolean).join(" ") ||
        person.email ||
        `User ${person.id}`;
    const user_types = parseUserTypes({ user_types: person.user_types });
    const is_self = person.id == actor_user_id;
    const reaches_everything =
        user_types.includes("super_admin") || user_types.includes("admin");
    const bot_ids = parseIdList({ ids: person.bot_ids });
    const workspace_ids = parseIdList({ ids: person.workspace_ids });
    const bot_names = crew_bots
        .filter((bot) => bot_ids.includes(Number(bot.id)))
        .map((bot) => bot.name || `Bot ${bot.id}`);
    const workspace_names = crew_workspaces
        .filter((workspace) => workspace_ids.includes(Number(workspace.id)))
        .map((workspace) => workspace.name || `Workspace ${workspace.id}`);
    const access = reaches_everything
        ? "Every worker and workspace."
        : [
              bot_names.length
                  ? `Bots: ${bot_names.join(", ")}`
                  : "No bots.",
              workspace_names.length
                  ? `Workspaces: ${workspace_names.join(", ")}`
                  : "No workspaces.",
          ].join(" ");

    return (
        <SettingsGroup
            id="overview"
            title="Overview"
            description="Who this is, and what they can reach."
        >
            <Row className="w-full gap-4! flex-nowrap items-start">
                <UserAvatar person={person} size="lg" />
                <Stack className="grow min-w-0 gap-1!">
                    <Row className="gap-2! flex-nowrap items-center">
                        <Span className="text-sm font-bold leading-5 text-ink truncate">
                            {name}
                        </Span>
                        {is_self ? (
                            <Span className="shrink-0 text-[11px] font-bold leading-4 text-ink-secondary">
                                You
                            </Span>
                        ) : null}
                    </Row>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary truncate w-full">
                        {[person.email, person.username].filter(Boolean).join(" · ")}
                    </Span>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {UserTypes.filter((type) =>
                            user_types.includes(type.value),
                        )
                            .map((type) => type.title)
                            .join(", ") || "No user types"}
                    </Span>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {access}
                    </Span>
                </Stack>
            </Row>
        </SettingsGroup>
    );
}
