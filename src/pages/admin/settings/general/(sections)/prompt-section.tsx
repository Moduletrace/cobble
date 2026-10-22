import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import SystemPromptAppendForm from "../(partials)/system-prompt-append-form";

/**
 * The install-wide text every bot gets in its prompt. Only the super admin
 * sees it, since it changes what every bot on the install is told.
 */
export default function PromptSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Prompt appendix"
            description="Text added to every bot's instructions, right after its own. Use it for rules that hold for the whole install, like how bots should talk or what they must never do."
            id="prompt-appendix"
        >
            <SystemPromptAppendForm appendix={pageProps?.system_prompt_append} />
        </SettingsGroup>
    );
}
