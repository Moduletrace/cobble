import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot_id: number;
    bot_name?: string | null;
    workspace_id: number;
    workspace_name?: string | null;
    /**
     * Whether the bot is this workspace's admin now.
     */
    is_admin: boolean;
    /**
     * After a change saved: the header keeps the new state, so the menu
     * shows it when it opens again.
     */
    on_changed: (is_admin: boolean) => void;
};

/**
 * The header menu's row that makes the bot this workspace's admin, or
 * takes that away (super admins and admins; `api/admin/bots/set-bot-type`).
 * It asks first. The bot gets or loses the admin's tools from its next
 * reply here.
 */
export default function BotAdminMenuItem({
    bot_id,
    bot_name,
    workspace_id,
    workspace_name,
    is_admin,
    on_changed,
}: Props) {
    const [loading, setLoading] = useState(false);
    const name = bot_name || "this bot";
    const place = workspace_name || "this workspace";

    const toggle = async () => {
        const given = !is_admin;

        if (
            !window.confirm(
                given
                    ? `Make ${name} the admin of ${place}? It will hand tasks to the other bots here, set their instructions here, run the workspace's tasks and keep its context.`
                    : `Take away ${name}'s admin role in ${place}?`,
            )
        ) {
            return;
        }

        setLoading(true);

        const res = await postAdminApi({
            path: "bots/set-bot-type",
            body: { bot_id, workspace_id, bot_type: "admin", given },
        }).catch(() => null);

        setLoading(false);

        if (res?.success) {
            on_changed(given);
            return;
        }

        window.alert(res?.msg || "That didn't work.");
    };

    return (
        <HeaderMenuItem
            icon={ShieldCheck}
            icon_class_name={
                is_admin
                    ? "fill-success text-on-ink dark:fill-success-dark"
                    : undefined
            }
            title={is_admin ? "Remove as admin" : "Make workspace admin"}
            hint={is_admin ? "Admin" : undefined}
            description={
                is_admin
                    ? `${name} leads the bots in ${place}: take that away`
                    : `Make ${name} the admin of ${place}: it leads the other bots here`
            }
            loading={loading}
            disabled={loading}
            onClick={toggle}
            icon_size={18}
        />
    );
}
