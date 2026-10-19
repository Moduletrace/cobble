import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import BotHarnessForm from "../../(partials)/bot-harness-form";

/**
 * A worker bot's models: per harness, the default or its own pick. The
 * same form as the chat header's models modal.
 */
export default function BotModelsSection() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;
    const overview = pageProps?.bot_harness_overview;

    if (!bot?.id || !overview) return null;

    return (
        <SettingsShell
            title={`${bot.name}'s models`}
            description="Uses the default models unless you pick its own."
        >
            <BotHarnessForm bot={bot} harnesses={overview.harnesses} />
        </SettingsShell>
    );
}
