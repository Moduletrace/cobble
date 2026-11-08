import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import MessageLengthForm from "../(partials)/message-length-form";

/**
 * The longest chat message a user may send. Only the super admin sees it,
 * since it changes every conversation.
 */
export default function MessageLengthSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Messages"
            description="How long a message users may send to a bot. The whole message goes into the bot's reply and stays in the session's history, so a very long one costs tokens on every reply after it. Longer text can always go in as an attached file."
            id="messages"
        >
            <MessageLengthForm length={pageProps?.message_length} />
        </SettingsGroup>
    );
}
