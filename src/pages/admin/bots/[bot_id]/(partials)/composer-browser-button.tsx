import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Compass } from "lucide-react";
import BrowserDefaultPicker from "@/src/components/general/browser-default-picker";

type Props = {
    bot_id: number;
    bot_name: string;
    workspace_id?: number | null;
};

/**
 * Beside the composer's tools: the user's own browsers for this bot or the
 * workspace it's in. The picker mounts only when the modal opens.
 */
export default function ComposerBrowserButton({ bot_id, bot_name, workspace_id }: Props) {
    const [open, setOpen] = useState(false);
    const title = `Your browsers for ${bot_name}`;

    return (
        <Modal
            target={
                <Button
                    title={title}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={<Compass size={12} aria-hidden />}
                    className="shrink-0 gap-1! px-2! py-0.5! text-[12px] leading-4 text-ink-secondary"
                >
                    Browser
                </Button>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch pb-4">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{title}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    A bot in your browser acts as you, signed in as you.
                </Span>
            </Stack>
            {open ? (
                <BrowserDefaultPicker
                    id={`composer-browsers-${bot_id}`}
                    bot_id={workspace_id ? undefined : bot_id}
                    workspace_id={workspace_id}
                />
            ) : null}
        </Modal>
    );
}
