import type { BotExtensionsPayload } from "@/src/types";
import { extensionOptionValue, parseExtensionOptionValue } from "@/src/utils/extension-option-value";
import InlineAddSelect from "./inline-add-select";

type Props = {
    id: string;
    addable: BotExtensionsPayload["addable"];
    loading?: boolean;
    onAdd: (params: { kind: "mcp" | "tool"; id: number }) => void;
};

/**
 * Picks an MCP server or tool to give a bot.
 */
export default function ExtensionAddSelect({ id, addable, loading, onAdd }: Props) {
    return (
        <InlineAddSelect
            id={id}
            noun="tool or MCP server"
            options={addable.map((item) => ({
                value: extensionOptionValue(item),
                title: `${item.kind == "mcp" ? "MCP" : "Tool"} · ${item.name}`,
            }))}
            loading={loading}
            onAdd={({ value }) => {
                const picked = parseExtensionOptionValue({ value });
                if (picked) onAdd(picked);
            }}
        />
    );
}
