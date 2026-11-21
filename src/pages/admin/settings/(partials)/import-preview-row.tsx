import Select from "@moduletrace/twui/form/Select";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BookOpen, Library, Plug, Wrench } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import type { ExtensionImportAction, ExtensionImportPreviewItem, ExtensionBundleKind } from "@/src/types";
import SettingsListRow from "./settings-list-row";

type Props = {
    item: ExtensionImportPreviewItem;
    action: ExtensionImportAction;
    onAction: (action: ExtensionImportAction) => void;
};

const Icons: Record<ExtensionBundleKind, typeof Plug> = {
    mcp: Plug,
    tool: Wrench,
    skill: BookOpen,
    knowledgebase: Library,
};

const StatusLabels = {
    new: "New here",
    same: "Already here",
    conflict: "Different here",
    invalid: "Can't be read",
};

/**
 * One item of a bundle as the import would treat it: what it is, whether
 * this install has it already, what an overwrite would change, and the
 * choice of what to do with it.
 */
export default function ImportPreviewRow({ item, action, onAction }: Props) {
    const options = [
        { value: "add", title: "Import" },
        { value: "overwrite", title: "Overwrite" },
        { value: "copy", title: "Import a copy" },
        { value: "skip", title: "Skip" },
    ].filter((option) =>
        item.status == "new"
            ? ["add", "skip"].includes(option.value)
            : item.copy_only
              ? ["copy", "skip"].includes(option.value)
              : ["overwrite", "copy", "skip"].includes(option.value),
    );

    const lines = [
        item.differing.length ? `Differs: ${item.differing.join(", ")}` : "",
        item.key != item.name ? `Key: ${item.key}` : "",
        item.env_keys.length ? `Env keys: ${item.env_keys.join(", ")}` : "",
        item.document_count ? `${item.document_count} ${item.document_count == 1 ? "document" : "documents"}` : "",
        ...item.warnings,
    ].filter(Boolean);

    return (
        <Stack className="w-full gap-1! items-stretch border-0 border-b border-solid border-hairline last:border-b-0 pb-2">
            <SettingsListRow
                avatar={<IconTile Icon={Icons[item.kind]} />}
                title={item.name}
                badge={item.status == "same" ? undefined : StatusLabels[item.status]}
                subtitle={item.status == "invalid" ? item.problem : undefined}
            >
                {item.status == "invalid" ? null : (
                    <Select
                        label="What to do"
                        showLabel={false}
                        title={`What to do with ${item.name}`}
                        options={options}
                        value={action}
                        changeHandler={(value) => onAction(value as ExtensionImportAction)}
                        wrapperProps={{ className: "w-[9.5rem]" }}
                        input_props={{ className: "h-8! text-xs!" }}
                    />
                )}
            </SettingsListRow>
            {lines.length ? (
                <Stack className="gap-0! pl-11 pr-3">
                    {lines.map((line) => (
                        <Span key={line} className="text-xs leading-4 text-ink-secondary">
                            {line}
                        </Span>
                    ))}
                </Stack>
            ) : null}
        </Stack>
    );
}