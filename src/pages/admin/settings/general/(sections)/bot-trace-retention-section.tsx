import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import BotTraceRetentionForm from "../(partials)/bot-trace-retention-form";

/**
 * How long a run's detailed trace is kept: what the conversation's debug
 * view can still show. Only the super admin sees it, since it decides how
 * much every run keeps.
 */
export default function BotTraceRetentionSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Run traces"
            description="How long the debug view keeps what a run did in detail: every model turn with what it reasoned, every tool call with its arguments and answer. Older traces are deleted once a day. The bot's answers and steps are kept with the conversation either way."
            id="run-traces"
        >
            <BotTraceRetentionForm retention={pageProps?.bot_trace_retention} />
        </SettingsGroup>
    );
}