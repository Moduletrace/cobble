import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CircleAlert, type LucideIcon } from "lucide-react";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import type { BotExtension, BotExtensionKind, BotExtensionsPayload } from "@/src/types";
import ComposerToolRow from "./composer-tool-row";

/**
 * What one of the composer's buttons is about, in copy: its tools, or its
 * knowledgebases.
 */
export type ComposerExtensionsCopy = {
    id: string;
    Icon: LucideIcon;
    /**
     * "tool" and "tools", for the button's count.
     */
    one: string;
    many: string;
    /**
     * The button's label with nothing yet, e.g. "Add tools".
     */
    empty_label: string;
    /**
     * The modal's heading, with the bot's name.
     */
    title: string;
    some: string;
    none: string;
    /**
     * Above the picker, and in its placeholder.
     */
    add_hint: string;
    add_noun: string;
};

type Props = {
    bot_name: string;
    copy: ComposerExtensionsCopy;
    attached: BotExtension[];
    addable: BotExtensionsPayload["addable"];
    can_manage: boolean;
    /**
     * The extension being changed, as `kind:id`.
     */
    busy?: string;
    onAdd: (params: { kind: BotExtensionKind; id: number }) => Promise<boolean>;
    onRemove: (params: { kind: BotExtensionKind; id: number; name: string }) => Promise<boolean>;
};

/**
 * One of the composer's buttons: how many tools (or knowledgebases) the
 * bot can use here, opening them in a modal rather than filling the
 * composer with chips. Super admins and admins remove any it was given
 * (even one every bot started with) and add more; a workspace's own stay.
 */
export default function ComposerToolsModal({
    bot_name,
    copy,
    attached,
    addable,
    can_manage,
    busy,
    onAdd,
    onRemove,
}: Props) {
    const [open, setOpen] = useState(false);
    const count = attached.length;
    const has_problem = attached.some(
        (item) => !item.enabled || item.state == "error",
    );
    const TriggerIcon = has_problem ? CircleAlert : copy.Icon;
    const label = count ? `${count} ${count == 1 ? copy.one : copy.many}` : copy.empty_label;

    return (
        <Modal
            target={
                <Button
                    title={copy.title}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={<TriggerIcon size={12} aria-hidden />}
                    className="shrink-0 gap-1! px-2! py-0.5! text-[12px] leading-4 text-ink-secondary"
                >
                    {label}
                </Button>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {copy.title}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {count ? copy.some : copy.none}
                </Span>
            </Stack>

            {count ? (
                <Stack
                    aria-label={copy.title}
                    className="w-full mt-4 py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface"
                >
                    {attached.map((item) => (
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
            ) : null}

            {can_manage && addable.length ? (
                <Stack className="w-full mt-4 gap-2! items-stretch">
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {copy.add_hint}
                    </Span>
                    <ExtensionAddSelect
                        id={copy.id}
                        noun={copy.add_noun}
                        addable={addable}
                        loading={Boolean(busy)}
                        onAdd={onAdd}
                    />
                </Stack>
            ) : null}
        </Modal>
    );
}
