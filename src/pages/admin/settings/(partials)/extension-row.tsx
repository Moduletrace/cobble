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
 * The settings page each kind is managed on.
 */
const ExtensionHrefs = {
    mcp: "/admin/settings/mcps",
    tool: "/admin/settings/tools",
    skill: "/admin/settings/skills",
} as const;

/**
 * One MCP server, tool or skill a bot or workspace has, and whether it's
 * working. A skill has nothing to connect or run, so it never reports a
 * failure.
 */
export default function ExtensionRow({ item, busy, onRemove }: Props) {
    const state = !item.enabled
        ? "Off for every bot"
        : item.kind == "skill"
          ? ""
          : item.state == "error"
            ? "Not working"
            : item.state == "untested"
              ? "Not checked yet"
              : "";

    return (
        <SettingsListRow
            avatar={<IconTile Icon={extensionIcon({ kind: item.kind })} />}
            title={item.name}
            href={ExtensionHrefs[item.kind]}
            subtitle={[item.detail, state].filter(Boolean).join(" · ")}
        >
            {onRemove ? (
                <SettingsRowAction title={`Remove ${item.name}`} label="Remove" disabled={busy} onClick={onRemove} />
            ) : null}
        </SettingsListRow>
    );
}
