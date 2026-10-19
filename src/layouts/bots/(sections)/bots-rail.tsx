"use client";

import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import useLiveBots from "@/src/hooks/use-live-bots";
import useLiveWorkspaces from "../(hooks)/use-live-workspaces";
import { RailPages } from "@/src/dict/rail-pages-dict";
import { RailDrawerContext } from "../(data)/rail-drawer-context";
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
 * those pages (`RailPages`). Below `md` it is a slide-over drawer from the
 * pane header's menu button; from `md` it is a 64px icon rail, and from
 * `lg` the full 260px rail. Its own width, not the viewport's, decides
 * whether it shows names (a container query), so the drawer opens full.
 */
export default function BotsRail() {
    const { pageProps } = useContext(AppContext);
    const { open, setOpen } = useContext(RailDrawerContext);

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
        <>
            {open ? (
                <Stack
                    aria-hidden
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-30 bg-ink/40 md:hidden"
                />
            ) : null}
            <Stack
                className={`@container fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] shrink-0 h-full gap-0! items-stretch bg-paper border-0 border-r border-solid border-hairline shadow-popover transition-transform duration-[var(--m-base)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:static md:z-auto md:w-16 md:max-w-none md:shadow-none md:pt-0 md:pb-0 lg:w-[260px] ${
                    open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
                aria-label={is_settings_page ? "Settings" : in_workspace ? workspace?.name || "Workspace" : "Bots"}
            >
                <RailHeader show_add={!is_settings_page && !is_rail_page} />
                <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch px-2 @rail:px-3 pt-1 pb-3">
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
        </>
    );
}
