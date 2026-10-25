import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageSquare, NotebookPen, ShieldCheck, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import BotAvatar from "@/src/components/general/bot-avatar";
import AdminShield from "@/src/components/general/admin-shield";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { WorkspaceBot } from "@/src/types";

type Props = {
    bot: WorkspaceBot;
    /**
     * The bot's settings page; left out for the coordinator, which only
     * super admins manage.
     */
    settings_href?: string;
    /**
     * Its conversation here.
     */
    chat_href: string;
    removing?: boolean;
    /**
     * Its admin role here is being changed.
     */
    toggling_admin?: boolean;
    onEdit: () => void;
    onRemove: () => void;
    onToggleAdmin: () => void;
};

/**
 * A bot in the workspace: opens its settings (or, for the coordinator,
 * its conversation here), chats with it here, makes it the workspace's
 * admin (or takes that away), edits what it has for this workspace alone,
 * or takes it out.
 */
export default function WorkspaceBotRow({
    bot,
    settings_href,
    chat_href,
    removing,
    toggling_admin,
    onEdit,
    onRemove,
    onToggleAdmin,
}: Props) {
    const name = bot.name || "This bot";
    const has_own = Boolean(
        bot.workspace_system_prompt || bot.workspace_memory,
    );
    const title_href = settings_href || chat_href;

    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            <BotAvatar
                image_media_id={bot.image_media_id}
                {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                face={(bot.face || "idle") as BotFace}
            />
            <Link
                href={title_href}
                title={
                    settings_href
                        ? `${name}'s settings`
                        : `Talk to ${name} here`
                }
                className="grow min-w-0 flex flex-col border-0 leading-normal hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink rounded-default-sm"
            >
                <Row className="w-full min-w-0 gap-1! flex-nowrap">
                    <Span className="min-w-0 text-sm font-bold leading-5 text-ink truncate">
                        {name}
                    </Span>
                    {bot.is_admin ? <AdminShield /> : null}
                </Row>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {bot.is_admin ? "Admin: leads the bots here · " : ""}
                    {has_own
                        ? "Has instructions for this workspace"
                        : bot.role || "Uses its own instructions here"}
                </Span>
            </Link>
            <Stack className="shrink-0 flex-row! gap-1!">
                {settings_href ? (
                    <Button
                        title={`Talk to ${name} here`}
                        aria-label={`Talk to ${name} here`}
                        type="button"
                        variant="ghost"
                        color="text"
                        href={chat_href}
                        className="p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default"
                    >
                        <MessageSquare size={16} aria-hidden />
                    </Button>
                ) : null}
                <Button
                    title={bot.is_admin ? `${name} is this workspace's admin: take that away` : `Make ${name} this workspace's admin`}
                    aria-label={bot.is_admin ? `Take away ${name}'s admin role here` : `Make ${name} this workspace's admin`}
                    aria-pressed={Boolean(bot.is_admin)}
                    type="button"
                    variant="ghost"
                    color="text"
                    loading={toggling_admin}
                    disabled={toggling_admin}
                    onClick={onToggleAdmin}
                    className="p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default"
                >
                    <ShieldCheck
                        size={16}
                        aria-hidden
                        className={twMerge(bot.is_admin && "fill-success text-on-ink dark:fill-success-dark")}
                    />
                </Button>
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
