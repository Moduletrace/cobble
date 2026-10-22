import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CircleAlert, Wrench } from "lucide-react";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import type { BotExtension, BotExtensionsPayload } from "@/src/types";
import ComposerToolRow from "./composer-tool-row";

type Props = {
    bot_name: string;
    attached: BotExtension[];
    addable: BotExtensionsPayload["addable"];
    can_manage: boolean;
    /**
     * The extension being changed, as `kind:id`.
     */
    busy?: string;
    onAdd: (params: { kind: "mcp" | "tool" | "skill"; id: number }) => Promise<boolean>;
    onRemove: (params: {
        kind: "mcp" | "tool" | "skill";
        id: number;
        name: string;
    }) => Promise<boolean>;
};

/**
 * The composer's tools button: how many MCP servers, tools and skills the
 * bot can use here, opening them in a modal rather than filling the
 * composer with chips. Super admins and admins remove any it was given
 * (even one every bot started with) and add more; a workspace's own stay.
 */
export default function ComposerToolsModal({
    bot_name,
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
    const TriggerIcon = has_problem ? CircleAlert : Wrench;
    const label = count ? `${count} ${count == 1 ? "tool" : "tools"}` : "Add tools";

    return (
        <Modal
            target={
                <Button
                    title={`The tools ${bot_name} can use here`}
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
                    {`Tools ${bot_name} can use here`}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {count
                        ? "MCP servers, tools and skills it was given, plus this workspace's. Remove one to take it away, or add another below."
                        : "It has none yet. Give it an MCP server, tool or skill below, or make one under Settings."}
                </Span>
            </Stack>

            {count ? (
                <Stack
                    aria-label={`Tools ${bot_name} can use here`}
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
                        {`Give ${bot_name} another one. It can use it everywhere it works, for everyone it works for.`}
                    </Span>
                    <ExtensionAddSelect
                        id="composer-add-extension"
                        addable={addable}
                        loading={Boolean(busy)}
                        onAdd={onAdd}
                    />
                </Stack>
            ) : null}
        </Modal>
    );
}
