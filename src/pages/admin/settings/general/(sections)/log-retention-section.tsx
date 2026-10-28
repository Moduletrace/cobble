import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import LogRetentionForm from "../(partials)/log-retention-form";

/**
 * How long logs (Activity) are kept. Only the super admin sees it, since
 * only the super admin reads them.
 */
export default function LogRetentionSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Activity log"
            description="How long sign-ins, routine runs, errors and other events in Activity are kept. Older entries are deleted once a day."
            id="activity-log"
        >
            <LogRetentionForm retention={pageProps?.log_retention} />
        </SettingsGroup>
    );
}
