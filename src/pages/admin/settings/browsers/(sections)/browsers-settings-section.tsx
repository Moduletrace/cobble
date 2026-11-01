import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { Plus } from "lucide-react";
import BrowserDefaultPicker from "@/src/components/general/browser-default-picker";
import { AppContext } from "@/src/pages/__root";
import type { BrowserRecord } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import BrowserModal from "../(partials)/browser-modal";
import BrowserRow from "../(partials)/browser-row";
import BrowserSetupHelp from "../(partials)/browser-setup-help";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The user's browsers, how to connect one, and the default for all their
 * bots. A bot or workspace can choose differently from its own settings or
 * under the composer.
 */
export default function BrowsersSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [browsers, setBrowsers] = useState(pageProps?.browsers || []);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();
    /**
     * Remounts what reads the list when it changes.
     */
    const [version, setVersion] = useState(0);

    const changed = (next: BrowserRecord[], msg: string) => {
        setBrowsers(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };

    return (
        <>
            <SettingsGroup
                title="Your browsers"
                description="Bots reach a browser through an MCP server you run beside it. Adding one gives it to no bot until you choose where it applies."
            >
                {adding ? (
                    <BrowserModal
                        onSaved={(next, msg) => {
                            setAdding(false);
                            changed(next, msg);
                        }}
                        onCancel={() => setAdding(false)}
                    />
                ) : null}
                <SettingsList is_empty={!browsers.length} empty="No browsers yet. Bots use their computer's browser.">
                    {browsers.map((browser) => (
                        <BrowserRow
                            key={`${browser.id}-${version}`}
                            browser={browser}
                            onChanged={changed}
                            onError={(msg) => setStatus({ error: true, msg })}
                        />
                    ))}
                </SettingsList>
                {!adding ? (
                    <Button
                        title="Add a browser"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={() => setAdding(true)}
                        className="self-start gap-1!"
                    >
                        <Plus size={14} aria-hidden />
                        New browser
                    </Button>
                ) : null}
                <SettingsStatus status={status} />
            </SettingsGroup>
            <SettingsGroup
                title="All your bots"
                description="Applies everywhere, unless a bot or workspace chooses differently. Routines only use a browser you've allowed them; hook calls and chatrooms never do."
            >
                <BrowserDefaultPicker key={version} id="browsers-all-bots" />
            </SettingsGroup>
            <SettingsGroup
                title="Connecting one"
                description="An MCP server on a browser has full control of everything it's signed in to."
            >
                <BrowserSetupHelp />
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Anyone who reaches that port can drive the browser, so keep it on this machine or a private network.
                </Span>
            </SettingsGroup>
        </>
    );
}
