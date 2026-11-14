import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import AskRetentionForm from "../(partials)/ask-retention-form";

/**
 * How long ended crew requests are kept, and how many one place keeps. Only
 * the super admin sees it, since it changes every user's requests.
 */
export default function AskRetentionSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Crew requests"
            description="How many requests bots keep per place, and for how long once they end. Open requests are never deleted, nor are the ones they were asked from."
            id="asks"
        >
            <AskRetentionForm retention={pageProps?.ask_retention} />
        </SettingsGroup>
    );
}
