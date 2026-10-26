import type { BotExtensionKind, BotExtensionsPayload } from "@/src/types";
import { extensionOptionValue, parseExtensionOptionValue } from "@/src/utils/extension-option-value";
import extensionNoun from "@/src/utils/extension-noun";
import InlineAddSelect from "./inline-add-select";

type Props = {
    id: string;
    addable: BotExtensionsPayload["addable"];
    loading?: boolean;
    onAdd: (params: { kind: BotExtensionKind; id: number }) => void;
    /**
     * What the picker offers, for its placeholder.
     */
    noun?: string;
};

/**
 * Picks an MCP server, tool, skill or knowledgebase to give a bot.
 */
export default function ExtensionAddSelect({ id, addable, loading, onAdd, noun = "tool, MCP server or skill" }: Props) {
    return (
        <InlineAddSelect
            id={id}
            noun={noun}
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
