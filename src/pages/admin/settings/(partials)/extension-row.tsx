import IconTile from "@/src/components/general/icon-tile";
import extensionIcon from "@/src/components/general/extension-icon";
import type { BotExtension } from "@/src/types";
import SettingsListRow from "./settings-list-row";
import SettingsRowAction from "./settings-row-action";

type Props = {
    item: BotExtension;
    busy?: boolean;
    onRemove?: () => void;
};

/**
 * One MCP server or tool a bot or workspace has, and whether it's working.
 */
export default function ExtensionRow({ item, busy, onRemove }: Props) {
    const state = !item.enabled
        ? "Off for every bot"
        : item.state == "error"
          ? "Not working"
          : item.state == "untested"
            ? "Not checked yet"
            : "";

    return (
        <SettingsListRow
            avatar={<IconTile Icon={extensionIcon({ kind: item.kind })} />}
            title={item.name}
            href={item.kind == "mcp" ? "/admin/settings/mcps" : "/admin/settings/tools"}
            subtitle={[item.detail, state].filter(Boolean).join(" · ")}
        >
            {onRemove ? (
                <SettingsRowAction title={`Remove ${item.name}`} label="Remove" disabled={busy} onClick={onRemove} />
            ) : null}
        </SettingsListRow>
    );
}
