import IconTile from "@/src/components/general/icon-tile";
import extensionIcon from "@/src/components/general/extension-icon";
import type { BotExtension } from "@/src/types";
import extensionStateNote from "@/src/utils/extension-state-note";
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
    knowledgebase: "/admin/settings/knowledgebases",
} as const;

/**
 * One MCP server, tool, skill or knowledgebase a bot or workspace has,
 * and whether it's working (`extensionStateNote`).
 */
export default function ExtensionRow({ item, busy, onRemove }: Props) {
    const state = extensionStateNote({ item });

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
