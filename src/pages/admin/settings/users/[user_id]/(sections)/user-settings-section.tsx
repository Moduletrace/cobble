import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import { UserTypes } from "@/src/dict/user-types-dict";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseUserTypes from "@/src/utils/parse-user-types";
import SettingsShell from "../../../(partials)/settings-shell";
import UserAccessGroups from "../(partials)/user-access-groups";
import UserDangerGroup from "../(partials)/user-danger-group";
import UserEditGroup from "../(partials)/user-edit-group";
import UserOverviewGroup from "../(partials)/user-overview-group";

/**
 * One user's settings: overview, the form that edits them, the bots and
 * workspaces they reach, and revoking
 * or deleting them where the actor may.
 */
export default function UserSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [person, setPerson] = useState<
        BUN_SQLITE_COBBLE_USERS_JOIN | undefined
    >(pageProps?.target_person || undefined);

    if (!person?.id) return null;

    const name =
        [person.first_name, person.last_name].filter(Boolean).join(" ") ||
        person.email ||
        `User ${person.id}`;
    const user_types = parseUserTypes({ user_types: person.user_types });
    const types_title = UserTypes.filter((type) =>
        user_types.includes(type.value),
    )
        .map((type) => type.title)
        .join(", ");

    return (
        <SettingsShell
            title={name}
            description={
                types_title || person.email || "A user on this install."
            }
            breadcrumb_title={name}
        >
            <UserOverviewGroup
                person={person}
                actor_user_id={pageProps?.user?.id}
                crew_bots={pageProps?.crew_bots || []}
                crew_workspaces={pageProps?.crew_workspaces || []}
            />
            <UserEditGroup person={person} onSaved={setPerson} />
            <UserAccessGroups
                person={person}
                crew_bots={pageProps?.crew_bots || []}
                crew_workspaces={pageProps?.crew_workspaces || []}
                onUpdated={setPerson}
            />
            <UserDangerGroup
                person={person}
                actor_user_id={pageProps?.user?.id}
                actor_user_types={pageProps?.user_types}
                onUpdated={setPerson}
            />
        </SettingsShell>
    );
}
