import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import useLiveBots from "@/src/hooks/use-live-bots";
import RailHeader from "../(partials)/rail-header";
import RailCrewList from "../(partials)/rail-crew-list";
import RailSettingsList from "../(partials)/rail-settings-list";
import RailUserRow from "../(partials)/rail-user-row";

/**
 * Left rail: wordmark, then the crew (pinned coordinator first). On
 * `/admin/settings/*` the crew is swapped for a back link and the settings
 * sub pages. Collapses to a 64px icon rail below 1024px.
 */
export default function BotsRail() {
    const { pageProps } = useContext(AppContext);

    const pathname = pageProps?.url?.pathname;
    const is_settings_page = Boolean(pathname?.startsWith("/admin/settings"));
    const bots = useLiveBots({
        bots: pageProps?.bots || [],
        open_bot_id: pageProps?.bot?.id || undefined,
    });

    return (
        <Stack
            className="w-16 lg:w-[260px] shrink-0 h-full gap-0! items-stretch border-0 border-r border-solid border-hairline"
            aria-label={is_settings_page ? "Settings" : "Bots"}
        >
            <RailHeader show_new_bot={!is_settings_page} />
            <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch px-2 lg:px-3 pt-1">
                {is_settings_page ? (
                    <RailSettingsList pathname={pathname} />
                ) : (
                    <RailCrewList
                        bots={bots}
                        selected_id={pageProps?.bot?.id || undefined}
                    />
                )}
            </Stack>
            <RailUserRow />
        </Stack>
    );
}
