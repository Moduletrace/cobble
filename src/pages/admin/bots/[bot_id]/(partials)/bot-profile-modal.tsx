import { useContext, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import BotForm from "@/src/layouts/bots/(partials)/bot-form";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * The header's avatar: opens the bot's profile (picture, name, job,
 * colour, instructions) to edit, for super admins and admins. Everyone
 * else sees the avatar alone.
 */
export default function BotProfileModal({ bot }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const name = bot.name || "This bot";

    const avatar = (
        <BotAvatar
            image_media_id={bot.image_media_id}
            hue={(bot.hue || null) as BotHue | null}
            face={(bot.face || "idle") as BotFace}
            size={40}
        />
    );

    if (!canManageCrew({ user_types: pageProps?.user_types })) {
        return <Stack className="shrink-0">{avatar}</Stack>;
    }

    return (
        <Modal
            target={
                <Button
                    title={`Edit ${name}`}
                    type="button"
                    variant="ghost"
                    color="text"
                    aria-label={`Edit ${name}`}
                    className="shrink-0 p-0! rounded-default hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                    {avatar}
                </Button>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{`Edit ${name}`}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {bot.kind == "coordinator"
                        ? "The coordinator keeps its name. Give it a picture, or change its core instructions."
                        : `${name}'s core instructions apply everywhere. What it does in one workspace is set on that workspace's page.`}
                </Span>
            </Stack>
            {open ? <BotForm bot={bot} onCancel={() => setOpen(false)} /> : null}
        </Modal>
    );
}
