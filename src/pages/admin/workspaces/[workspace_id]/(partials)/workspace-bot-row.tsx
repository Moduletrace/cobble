import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { NotebookPen, X } from "lucide-react";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { WorkspaceBot } from "@/src/types";

type Props = {
    bot: WorkspaceBot;
    href: string;
    removing?: boolean;
    onEdit: () => void;
    onRemove: () => void;
};

/**
 * A bot in the workspace: opens its conversation here, edits what it has
 * for this workspace alone, or takes it out.
 */
export default function WorkspaceBotRow({ bot, href, removing, onEdit, onRemove }: Props) {
    const name = bot.name || "This bot";
    const has_own = Boolean(bot.workspace_system_prompt || bot.workspace_memory);

    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            <BotAvatar image_media_id={bot.image_media_id} hue={(bot.hue || null) as BotHue | null} face={(bot.face || "idle") as BotFace} />
            <Link
                href={href}
                title={`Talk to ${name} here`}
                className="grow min-w-0 flex flex-col border-0 leading-normal hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink rounded-default-sm"
            >
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {has_own ? "Has instructions for this workspace" : bot.role || "Uses its own instructions here"}
                </Span>
            </Link>
            <Stack className="shrink-0 flex-row! gap-1!">
                <Button
                    title={`${name}'s instructions and memory here`}
                    aria-label={`${name}'s instructions and memory here`}
                    type="button"
                    variant="ghost"
                    color="text"
                    onClick={onEdit}
                    className="p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default"
                >
                    <NotebookPen size={16} aria-hidden />
                </Button>
                <Button
                    title={`Take ${name} out of this workspace`}
                    aria-label={`Take ${name} out of this workspace`}
                    type="button"
                    variant="ghost"
                    color="text"
                    loading={removing}
                    disabled={removing}
                    onClick={onRemove}
                    className="p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default"
                >
                    <X size={16} aria-hidden />
                </Button>
            </Stack>
        </Row>
    );
}
