import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import parseUserTypes from "@/src/utils/parse-user-types";
import canRevokeUser from "@/src/utils/rbac/can-revoke-user";
import revokeUser from "../../(functions)/revoke-user";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    actor_user_id?: number | string;
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    onUpdated: (person: BUN_SQLITE_COBBLE_USERS_JOIN) => void;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Revoking or deleting a user, where the actor may. Never yourself, and
 * never the super admin.
 */
export default function UserDangerGroup({
    person,
    actor_user_id,
    actor_user_types,
    onUpdated,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>();
    const name = person.first_name || "this user";
    const user_types = parseUserTypes({ user_types: person.user_types });
    const is_self = person.id == actor_user_id;
    const target_user_types = user_types.map((user_type) => ({ user_type }));
    const can_delete =
        !is_self &&
        canRevokeUser({ user_types: actor_user_types, target_user_types });
    const can_revoke = can_delete && !user_types.includes("revoked");

    const revoke = async () => {
        if (
            busy ||
            !window.confirm(
                `Revoke ${name}? They can't sign in until Revoked is removed from their user types. Their crew and files are kept.`,
            )
        )
            return;

        setBusy(true);
        setStatus(undefined);

        const res = await revokeUser({ person });

        setBusy(false);

        if (!res.success || !res.singleRes?.id) {
            setStatus({ error: true, msg: res.msg || "Couldn't revoke them." });
            return;
        }

        onUpdated(res.singleRes);
        setStatus({ success: true, msg: `${name} can't sign in now.` });
    };

    const remove = async () => {
        if (
            busy ||
            !window.confirm(
                `Delete ${name} with their bots, workspaces and computers? Their computers' files stay on disk.`,
            )
        )
            return;

        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi({
            path: "users/delete-user",
            body: { user_id: person.id },
        });

        if (res.success) {
            window.location.href = "/admin/settings/users";
            return;
        }

        setBusy(false);
        setStatus({ error: true, msg: res.msg || "Couldn't delete them." });
    };

    return (
        <SettingsGroup
            id="danger"
            title="Danger zone"
            description="Revoking keeps everything they had; deleting takes it with them."
        >
            {is_self ? (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    This is you. You can't revoke or delete yourself here.
                </Span>
            ) : !can_delete ? (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Nothing can be done here.
                </Span>
            ) : (
                <Row className="w-full gap-2! flex-wrap items-center">
                    {can_revoke ? (
                        <Button
                            title={`Revoke ${name}`}
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="small"
                            loading={busy}
                            disabled={busy}
                            onClick={revoke}
                        >
                            Revoke
                        </Button>
                    ) : null}
                    <Button
                        title={`Delete ${name}`}
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        loading={busy}
                        disabled={busy}
                        onClick={remove}
                    >
                        Delete user
                    </Button>
                </Row>
            )}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
