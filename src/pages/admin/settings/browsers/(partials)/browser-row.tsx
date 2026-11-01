import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Compass } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BrowserRecord } from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";
import checkedAgo from "../../(utils)/checked-ago";
import BrowserModal from "./browser-modal";

type Props = {
    browser: BrowserRecord;
    onChanged: (browsers: BrowserRecord[], msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * One of the user's browsers and whether it last connected. Being offline
 * is normal for a laptop, so it's said plainly, not as a fault.
 */
export default function BrowserRow({ browser, onChanged, onError }: Props) {
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);

    const remove = async () => {
        if (busy || !window.confirm(`Remove ${browser.name}? Bots lose it at once.`)) return;

        setBusy(true);
        const res = await postAdminApi<BrowserRecord[]>({
            path: "browsers/delete-browser",
            body: { browser_id: browser.id },
        });
        setBusy(false);

        if (res.success && res.singleRes) onChanged(res.singleRes, res.msg || "Removed.");
        else onError(res.msg || "That didn't work.");
    };

    const tools = `${browser.tools.length} ${browser.tools.length == 1 ? "tool" : "tools"}`;
    const when = browser.last_synced_at ? ` · checked ${checkedAgo({ at: browser.last_synced_at })}` : "";
    const status =
        browser.status == "ok"
            ? { text: `Connected · ${tools}${when}` }
            : browser.status == "error"
              ? { text: `Couldn't connect${when}`, error: browser.last_error }
              : { text: "Not connected yet." };

    return (
        <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <SettingsListRow
                avatar={<IconTile Icon={Compass} />}
                title={browser.name}
                badge={browser.enabled ? undefined : "Off"}
                subtitle={[browser.url, browser.allow_routines ? "Routines allowed" : ""].filter(Boolean).join(" · ")}
            >
                <SettingsRowAction
                    title={`Edit ${browser.name}`}
                    label="Edit"
                    disabled={busy}
                    onClick={() => setEditing(true)}
                />
                <SettingsRowAction title={`Remove ${browser.name}`} label="Delete" disabled={busy} onClick={remove} />
            </SettingsListRow>
            <ExtensionStatusLine state={browser.status} {...status} />
            {editing ? (
                <BrowserModal
                    browser={browser}
                    onSaved={(next, msg) => {
                        setEditing(false);
                        onChanged(next, msg);
                    }}
                    onCancel={() => setEditing(false)}
                />
            ) : null}
        </Stack>
    );
}
