import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import RunLimitsForm from "../(partials)/run-limits-form";

/**
 * How long a bot may work on one task or reply before it reports. Only the
 * super admin sees it, since it changes every bot on the install.
 */
export default function RunLimitsSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Run limits"
            description="How long a bot may work on one run before it must stop and report, and how much of its work it sends the model each turn. A task may take far more than a chat reply, since it does the long work."
            id="run-limits"
        >
            <RunLimitsForm limits={pageProps?.run_limits} />
        </SettingsGroup>
    );
}
