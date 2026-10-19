import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import BotHarnessForm from "../../../(partials)/bot-harness-form";
import SettingsSectionHeading from "../../../(partials)/settings-section-heading";
import SettingsShell from "../../../(partials)/settings-shell";
import BotComputersGroup from "../(partials)/bot-computers-group";
import BotDeleteGroup from "../(partials)/bot-delete-group";
import BotDetailsGroup from "../(partials)/bot-details-group";
import BotOverviewGroup from "../(partials)/bot-overview-group";
import BotWorkspacesGroup from "../(partials)/bot-workspaces-group";

/**
 * One bot's settings: overview, details, models, workspaces, computers,
 * and deleting a worker. The same page shows the bot's information and
 * edits it.
 */
export default function BotSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [bot, setBot] = useState<BotWithLastMessage | undefined>(
        pageProps?.bot || undefined,
    );

    if (!bot?.id) return null;

    const name = bot.name || `Bot ${bot.id}`;
    const is_coordinator = bot.kind == "coordinator";
    const harnesses = pageProps?.bot_harness_overview?.harnesses;

    return (
        <SettingsShell
            title={name}
            description={
                bot.role ||
                (is_coordinator
                    ? "Coordinates your crew and hands work to it"
                    : "A worker bot.")
            }
            breadcrumb_title={name}
        >
            <BotOverviewGroup bot={bot} />
            <BotDetailsGroup
                bot={bot}
                onSaved={(saved: BUN_SQLITE_COBBLE_BOTS) =>
                    setBot((prev) => ({ ...(prev || bot), ...saved }))
                }
            />
            {harnesses?.length ? (
                <>
                    <SettingsSectionHeading
                        id="models"
                        title="Models"
                        description={
                            is_coordinator
                                ? "The coordinator and every bot left on the default use these. The text model chats, plans and drives computers; the others read media, transcribe, speak and make images."
                                : "Uses the default models unless you pick its own. In a workspace, that workspace's models win. The text model chats, plans and drives computers; the others read, transcribe, speak and make images."
                        }
                    />
                    <BotHarnessForm bot={bot} harnesses={harnesses} />
                </>
            ) : null}
            <BotWorkspacesGroup
                bot={bot}
                workspaces={pageProps?.workspaces || []}
                bot_workspaces={pageProps?.bot_workspaces || []}
            />
            <BotComputersGroup
                bot={bot}
                computers={pageProps?.bot_computers || []}
                all_computers={pageProps?.computers || []}
            />
            {is_coordinator ? null : <BotDeleteGroup bot={bot} />}
        </SettingsShell>
    );
}
