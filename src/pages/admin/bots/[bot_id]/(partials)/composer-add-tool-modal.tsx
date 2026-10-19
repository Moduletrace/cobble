import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import type { BotExtensionsPayload } from "@/src/types";

type Props = {
    bot_name: string;
    addable: BotExtensionsPayload["addable"];
    loading?: boolean;
    onAdd: (params: { kind: "mcp" | "tool"; id: number }) => Promise<boolean>;
};

/**
 * The "Add" chip under the composer: picks an MCP server or tool to give
 * the bot, everywhere it works.
 */
export default function ComposerAddToolModal({
    bot_name,
    addable,
    loading,
    onAdd,
}: Props) {
    const [open, setOpen] = useState(false);

    if (!addable.length) return null;

    return (
        <Modal
            target={
                <Button
                    title={`Give ${bot_name} a tool or MCP server`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={<Plus size={12} aria-hidden />}
                    className="gap-1! px-2! py-0.5! text-[12px] leading-4"
                >
                    Add
                </Button>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-4! items-stretch">
                <Stack className="w-full gap-1! items-stretch">
                    <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                        Add a tool
                    </H2>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {`${bot_name} can use it everywhere it works, for everyone it works for.`}
                    </Span>
                </Stack>
                <ExtensionAddSelect
                    id="composer-add-extension"
                    addable={addable}
                    loading={loading}
                    onAdd={async (picked) => {
                        if (await onAdd(picked)) setOpen(false);
                    }}
                />
            </Stack>
        </Modal>
    );
}
