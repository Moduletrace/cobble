import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseUserTypes from "@/src/utils/parse-user-types";

type Props = ReturnType<typeof useFormInit<UserFormObject>> & {
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

/**
 * Picks the workers a user chats with and the workspaces they work in.
 * Shown where the page carries the crew (`crew_bots`, `crew_workspaces`),
 * and only for a user who'd reach nothing without it: super admins and
 * admins reach every worker and workspace anyway.
 */
export default function UserFormAccess({ setForm, form, person, app_context }: Props) {
    const bots = app_context.pageProps?.crew_bots;
    const workspaces = app_context.pageProps?.crew_workspaces;

    if (!bots || !workspaces) return null;

    const types = [...parseUserTypes({ user_types: person?.user_types }), ...(form.user_types || [])];

    if (types.includes("super_admin") || types.includes("admin")) return null;

    return (
        <Stack className="w-full gap-4! items-stretch">
            <SearchSelect
                id="user-form-bots"
                title="Bots"
                label="Bots"
                showLabel
                multiple
                placeholder="Pick the bots they chat with"
                options={bots.map((bot) => ({
                    value: String(bot.id),
                    title: bot.role ? `${bot.name} (${bot.role})` : bot.name || `Bot ${bot.id}`,
                }))}
                defaultValues={(form.bot_ids || []).map(String)}
                info="They chat with these in their own chat. They reach no bot until one is picked here or they're in a workspace."
                changeHandler={(value) => {
                    const ids = (Array.isArray(value) ? value : value ? [value] : []).map(Number);
                    setForm((prev) => ({ ...prev, bot_ids: ids }));
                }}
            />
            <SearchSelect
                id="user-form-workspaces"
                title="Workspaces"
                label="Workspaces"
                showLabel
                multiple
                placeholder="Pick the workspaces they work in"
                options={workspaces.map((workspace) => ({
                    value: String(workspace.id),
                    title: workspace.name || `Workspace ${workspace.id}`,
                }))}
                defaultValues={(form.workspace_ids || []).map(String)}
                info="They chat with every bot in these workspaces, there."
                changeHandler={(value) => {
                    const ids = (Array.isArray(value) ? value : value ? [value] : []).map(Number);
                    setForm((prev) => ({ ...prev, workspace_ids: ids }));
                }}
            />
        </Stack>
    );
}
