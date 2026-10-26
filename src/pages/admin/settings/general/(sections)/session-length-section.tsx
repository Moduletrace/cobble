import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import SessionLengthForm from "../(partials)/session-length-form";

/**
 * How many messages a session takes. Only the super admin sees it, since
 * it changes every conversation.
 */
export default function SessionLengthSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Sessions"
            description="Every reply re-reads the session's recent messages, so a long session costs more tokens each time. Once a session has this many messages, the user's next message starts a new one, carrying a summary of the last. Bots can also move a conversation on sooner."
            id="sessions"
        >
            <SessionLengthForm length={pageProps?.session_length} />
        </SettingsGroup>
    );
}
