import { useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { UserGrantKind } from "@/src/schemas/user-schema";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseIdList from "@/src/utils/parse-id-list";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";
import UserAccessRow, { type UserAccessItem } from "./user-access-row";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    kind: UserGrantKind;
    id: string;
    title: string;
    description: string;
    /**
     * Shown when they have none.
     */
    empty: string;
    /**
     * Every worker or every workspace on the install.
     */
    items: UserAccessItem[];
    onUpdated: (person: BUN_SQLITE_COBBLE_USERS_JOIN) => void;
};

/**
 * The workers or workspaces a user reaches, each added or taken away at
 * once (`users/add-access`, `users/remove-access`).
 */
export default function UserAccessGroup({ person, kind, id, title, description, empty, items, onUpdated }: Props) {
    const [busy_id, setBusyId] = useState<number | "add">();
    const [error, setError] = useState<string>();

    const granted_ids = parseIdList({ ids: kind == "bot" ? person.bot_ids : person.workspace_ids });
    const granted = items.filter((item) => granted_ids.includes(item.id));
    const addable = items.filter((item) => !granted_ids.includes(item.id));

    const change = async ({ path, item_id }: { path: "add-access" | "remove-access"; item_id: number }) => {
        setBusyId(path == "add-access" ? "add" : item_id);
        setError(undefined);

        const res = await postAdminApi<BUN_SQLITE_COBBLE_USERS_JOIN>({
            path: `users/${path}`,
            body: { user_id: person.id, kind, id: item_id },
        });

        setBusyId(undefined);

        if (!res.success || !res.singleRes?.id) {
            setError(res.msg || "That didn't work.");
            return;
        }

        onUpdated(res.singleRes);
    };

    return (
        <SettingsGroup id={id} title={title} description={description}>
            <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                {granted.map((item) => (
                    <UserAccessRow
                        key={item.id}
                        {...item}
                        noun={kind}
                        removing={busy_id == item.id}
                        onRemove={() => change({ path: "remove-access", item_id: item.id })}
                    />
                ))}
                {granted.length ? null : (
                    <Span className="px-4 py-4 text-[13px] leading-[18px] text-ink-secondary">{empty}</Span>
                )}
            </Stack>
            <InlineAddSelect
                id={`user-add-${kind}`}
                noun={kind}
                options={addable.map((item) => ({ value: String(item.id), title: item.name }))}
                loading={busy_id == "add"}
                onAdd={({ value }) => change({ path: "add-access", item_id: Number(value) })}
            />
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
        </SettingsGroup>
    );
}
