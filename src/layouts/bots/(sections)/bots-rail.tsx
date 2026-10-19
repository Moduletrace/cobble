import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import useLiveBots from "@/src/hooks/use-live-bots";
import useLiveWorkspaces from "../(hooks)/use-live-workspaces";
import { RailPages } from "@/src/dict/rail-pages-dict";
import RailHeader from "../(partials)/rail-header";
import RailPagesList from "../(partials)/rail-pages-list";
import RailCrewList from "../(partials)/rail-crew-list";
import RailSettingsAside from "../(partials)/rail-settings-aside";
import RailUserRow from "../(partials)/rail-user-row";
import RailWorkspaceList from "../(partials)/rail-workspace-list";

/**
 * Left rail: wordmark and Add, then the crew (pinned coordinator first,
 * the latest bots, the workspaces). Inside a workspace it lists that
 * workspace's crew instead; on `/admin/settings/*` a back link and the
 * settings sub pages, and on routines, activity and help a back link and
 * those pages (`RailPages`). Collapses to a 64px icon rail below 1024px.
 */
export default function BotsRail() {
    const { pageProps } = useContext(AppContext);

    const pathname = pageProps?.url?.pathname;
    const is_settings_page = Boolean(pathname?.startsWith("/admin/settings"));
    const is_rail_page = RailPages.some(
        (page) => pathname == page.url || Boolean(pathname?.startsWith(`${page.url}/`)),
    );
    const workspace = pageProps?.workspace;
    const in_workspace = Boolean(workspace?.id && pathname?.startsWith("/admin/workspaces/"));

    const bots = useLiveBots({
        bots: pageProps?.bots || [],
        open_bot_id: pageProps?.bot?.id || undefined,
        workspace_id: in_workspace ? workspace?.id || null : null,
    });
    const workspaces = useLiveWorkspaces({
        workspaces: pageProps?.workspaces || [],
        open_workspace_id: in_workspace ? workspace?.id || undefined : undefined,
    });
    const live_workspace = workspaces.find((w) => w.id == workspace?.id);

    return (
        <Stack
            className="w-16 lg:w-[260px] shrink-0 h-full gap-0! items-stretch border-0 border-r border-solid border-hairline"
            aria-label={is_settings_page ? "Settings" : in_workspace ? workspace?.name || "Workspace" : "Bots"}
        >
            <RailHeader show_add={!is_settings_page && !is_rail_page} />
            <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch px-2 lg:px-3 pt-1 pb-3">
                {is_settings_page ? (
                    <RailSettingsAside pathname={pathname} />
                ) : is_rail_page ? (
                    <RailPagesList pathname={pathname} />
                ) : in_workspace && live_workspace ? (
                    <RailWorkspaceList
                        workspace={live_workspace}
                        bots={bots}
                        selected_id={pageProps?.bot?.id || undefined}
                        on_workspace_page={!pageProps?.bot?.id}
                    />
                ) : (
                    <RailCrewList
                        bots={bots}
                        workspaces={workspaces}
                        selected_id={pageProps?.bot?.id || undefined}
                    />
                )}
            </Stack>
            <RailUserRow />
        </Stack>
    );
}
