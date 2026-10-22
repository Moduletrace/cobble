import type { BotExtensionsPayload } from "@/src/types";
import { extensionOptionValue, parseExtensionOptionValue } from "@/src/utils/extension-option-value";
import extensionNoun from "@/src/utils/extension-noun";
import InlineAddSelect from "./inline-add-select";

type Props = {
    id: string;
    addable: BotExtensionsPayload["addable"];
    loading?: boolean;
    onAdd: (params: { kind: "mcp" | "tool" | "skill"; id: number }) => void;
};

/**
 * Picks an MCP server, tool or skill to give a bot.
 */
export default function ExtensionAddSelect({ id, addable, loading, onAdd }: Props) {
    return (
        <InlineAddSelect
            id={id}
            noun="tool, MCP server or skill"
            options={addable.map((item) => ({
                value: extensionOptionValue(item),
                title: `${extensionNoun({ kind: item.kind })}: ${item.name}`,
            }))}
            loading={loading}
            onAdd={({ value }) => {
                const picked = parseExtensionOptionValue({ value });
                if (picked) onAdd(picked);
            }}
        />
    );
}
