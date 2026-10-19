import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Plug, Wrench } from "lucide-react";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import useExtensions from "@/src/hooks/use-extensions";
import type { BotExtensionsPayload } from "@/src/types";
import ExtensionRow from "./extension-row";
import SettingsGroup from "./settings-group";
import SettingsList from "./settings-list";
import SettingsStatus from "./settings-status";

type Props = {
    owner: { bot_id: number } | { workspace_id: number };
    owner_name: string;
    description: string;
    initial?: BotExtensionsPayload | null;
};

/**
 * The MCP servers and tools a bot or a workspace has, removable, and a
 * picker to add more. On the bot and workspace settings pages.
 */
export default function ExtensionsGroup({ owner, owner_name, description, initial }: Props) {
    const extensions = useExtensions({ owner, owner_name, initial });
    const id = "bot_id" in owner ? `bot-${owner.bot_id}` : `workspace-${owner.workspace_id}`;

    return (
        <SettingsGroup id="tools" title="Tools and MCP servers" description={description}>
            <SettingsList is_empty={!extensions.attached.length} empty="No tools or MCP servers yet.">
                {extensions.attached.map((item) => (
                    <ExtensionRow
                        key={`${item.kind}:${item.id}`}
                        item={item}
                        busy={extensions.busy == `${item.kind}:${item.id}`}
                        onRemove={
                            extensions.can_manage
                                ? () => extensions.remove({ kind: item.kind, id: item.id, name: item.name })
                                : undefined
                        }
                    />
                ))}
            </SettingsList>
            {extensions.can_manage ? (
                <ExtensionAddSelect
                    id={`${id}-add-extension`}
                    addable={extensions.addable}
                    loading={Boolean(extensions.busy)}
                    onAdd={extensions.add}
                />
            ) : null}
            <Row className="gap-1!">
                <Button
                    title="Manage MCP servers"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    href="/admin/settings/mcps"
                    beforeIcon={<Plug size={14} aria-hidden />}
                    className="gap-1!"
                >
                    MCP servers
                </Button>
                <Button
                    title="Manage tools"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    href="/admin/settings/tools"
                    beforeIcon={<Wrench size={14} aria-hidden />}
                    className="gap-1!"
                >
                    Tools
                </Button>
            </Row>
            <SettingsStatus status={extensions.status} />
        </SettingsGroup>
    );
}
