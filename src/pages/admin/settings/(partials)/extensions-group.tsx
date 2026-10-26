import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { BookOpen, Library, Plug, Wrench } from "lucide-react";
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
    /**
     * `tools`: MCP servers, tools and skills. `knowledgebases`: only those.
     */
    variant?: "tools" | "knowledgebases";
};

/**
 * The MCP servers, tools and skills (or the knowledgebases) a bot or a
 * workspace has, removable, and a picker to add more. On the bot and
 * workspace settings pages.
 */
export default function ExtensionsGroup({ owner, owner_name, description, initial, variant = "tools" }: Props) {
    const extensions = useExtensions({ owner, owner_name, initial });
    const id = "bot_id" in owner ? `bot-${owner.bot_id}` : `workspace-${owner.workspace_id}`;
    const is_knowledge = variant == "knowledgebases";
    const fits = (item: { kind: string }) => (item.kind == "knowledgebase") == is_knowledge;
    const attached = extensions.attached.filter(fits);
    const addable = extensions.addable.filter(fits);

    return (
        <SettingsGroup
            id={is_knowledge ? "knowledgebases" : "tools"}
            title={is_knowledge ? "Knowledgebases" : "Tools, MCP servers and skills"}
            description={description}
        >
            <SettingsList
                is_empty={!attached.length}
                empty={is_knowledge ? "No knowledgebases yet." : "No tools, MCP servers or skills yet."}
            >
                {attached.map((item) => (
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
                    id={`${id}-add-${is_knowledge ? "knowledgebase" : "extension"}`}
                    noun={is_knowledge ? "knowledgebase" : undefined}
                    addable={addable}
                    loading={Boolean(extensions.busy)}
                    onAdd={extensions.add}
                />
            ) : null}
            {is_knowledge ? (
                <Button
                    title="Manage knowledgebases"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    href="/admin/settings/knowledgebases"
                    beforeIcon={<Library size={14} aria-hidden />}
                    className="self-start gap-1!"
                >
                    Knowledgebases
                </Button>
            ) : (
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
                <Button
                    title="Manage skills"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    href="/admin/settings/skills"
                    beforeIcon={<BookOpen size={14} aria-hidden />}
                    className="gap-1!"
                >
                    Skills
                </Button>
            </Row>
            )}
            <SettingsStatus status={extensions.status} />
        </SettingsGroup>
    );
}
