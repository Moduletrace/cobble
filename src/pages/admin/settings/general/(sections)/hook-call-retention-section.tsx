import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import HookCallRetentionForm from "../(partials)/hook-call-retention-form";

/**
 * How long hook calls and their responses are kept. Only the super admin
 * sees it, since it changes every user's hooks.
 */
export default function HookCallRetentionSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Hook calls"
            description="How long every call to a hook is kept, with what it sent and what its run answered, so you and the bots can search them. Older calls are deleted once a day; the chat messages their runs posted stay."
            id="hook-calls"
        >
            <HookCallRetentionForm retention={pageProps?.hook_call_retention} />
        </SettingsGroup>
    );
}
