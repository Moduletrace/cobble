import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import type {
    BotExtension,
    BotExtensionKind,
    BotExtensionsPayload,
} from "@/src/types";
import ComposerToolRow from "./composer-tool-row";

type Props = {
    /**
     * The add picker's element id, unique on the page.
     */
    id: string;
    /**
     * What the list is, for screen readers.
     */
    label: string;
    items: BotExtension[];
    addable: BotExtensionsPayload["addable"];
    can_manage: boolean;
    /**
     * The extension being changed, as `kind:id`.
     */
    busy?: string;
    /**
     * Said instead of the list when it holds nothing.
     */
    empty?: string;
    add_hint: string;
    add_noun: string;
    onAdd: (params: { kind: BotExtensionKind; id: number }) => Promise<boolean>;
    onRemove: (params: {
        kind: BotExtensionKind;
        id: number;
        name: string;
    }) => Promise<boolean>;
};

/**
 * What a bot can use here as a list, then the picker for more: shared by
 * the composer's modals and the bot panel's tools tab. Super admins and
 * admins take away any it was given (even one every bot started with); a
 * workspace's own stay.
 */
export default function ComposerExtensionsList({
    id,
    label,
    items,
    addable,
    can_manage,
    busy,
    empty,
    add_hint,
    add_noun,
    onAdd,
    onRemove,
}: Props) {
    return (
        <>
            {items.length ? (
                <Stack
                    aria-label={label}
                    className="w-full mt-4 py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface"
                >
                    {items.map((item) => (
                        <ComposerToolRow
                            key={`${item.kind}:${item.id}`}
                            item={item}
                            busy={busy == `${item.kind}:${item.id}`}
                            onRemove={
                                can_manage && item.source == "bot"
                                    ? () =>
                                          onRemove({
                                              kind: item.kind,
                                              id: item.id,
                                              name: item.name,
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </Stack>
            ) : empty ? (
                <Span className="mt-4 text-[13px] leading-[18px] text-ink-secondary">{empty}</Span>
            ) : null}

            {can_manage && addable.length ? (
                <Stack className="w-full mt-4 gap-2! items-stretch">
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">{add_hint}</Span>
                    <ExtensionAddSelect
                        id={id}
                        noun={add_noun}
                        addable={addable}
                        loading={Boolean(busy)}
                        onAdd={onAdd}
                    />
                </Stack>
            ) : null}
        </>
    );
}