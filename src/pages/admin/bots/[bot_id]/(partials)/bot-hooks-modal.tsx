import { useContext, useEffect, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import { Plus, Webhook } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotHookWithNames, BotHookWithToken, BotWithLastMessage } from "@/src/types";
import HookCalls from "@/src/components/general/hook-calls";
import HookForm from "@/src/components/general/hook-form";
import HookRow from "@/src/components/general/hook-row";
import HookUrlNotice from "@/src/components/general/hook-url-notice";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import { AppContext } from "@/src/pages/__root";
import useBotHooks from "../(hooks)/use-bot-hooks";
import HeaderMenuItem from "./header-menu-item";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * What the modal shows besides the list: a form, a URL shown once, or a
 * hook's recent calls.
 */
type View =
    | { kind: "create" }
    | { kind: "edit"; hook: BotHookWithNames }
    | { kind: "url"; hook: BotHookWithNames; token: string }
    | { kind: "calls"; hook: BotHookWithNames };

type Props = {
    bot: BotWithLastMessage;
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    on_open?: () => void;
};

/**
 * The user's hooks in this conversation: secret URLs an outside service
 * (a webhook, a script) calls to give the bot a task, whose result lands
 * here. Open it from the header menu; the list loads then, so the page's
 * props stay small. The user makes, pauses, edits, re-keys and deletes
 * their own; bots never make hooks.
 */
export default function BotHooksModal({ bot, workspace, on_open }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, set_open] = useState(false);
    const [view, set_view] = useState<View>();
    const [busy, set_busy] = useState(false);
    const [status, set_status] = useState<Status>();
    const { hooks, setHooks, loading, error } = useBotHooks({
        bot_id: Number(bot.id),
        workspace_id: workspace?.id ? Number(workspace.id) : null,
        enabled: open,
    });

    const name = bot.name || "This bot";
    const place = workspace?.name || "this workspace";
    const title = workspace?.id ? `${place} hooks` : `${name}'s hooks`;

    useEffect(() => {
        if (open) on_open?.();
    }, [open]);

    const replace = ({ hook }: { hook: BotHookWithNames }) =>
        setHooks((prev) => (prev.some((h) => h.id == hook.id) ? prev.map((h) => (h.id == hook.id ? hook : h)) : [hook, ...prev]));

    const back = () => {
        set_view(undefined);
        set_status(undefined);
    };

    const toggle = async ({ hook }: { hook: BotHookWithNames }) => {
        if (busy) return;

        set_busy(true);
        set_status(undefined);

        const res = await postAdminApi<BotHookWithNames>({
            path: "hooks/update-hook",
            body: { hook_id: hook.id, enabled: !hook.enabled },
        });

        set_busy(false);

        if (!res.success || !res.singleRes) {
            set_status({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ hook: res.singleRes });
        set_status({ success: true, msg: hook.enabled ? "Paused." : "Resumed." });
    };

    const rotate = async ({ hook }: { hook: BotHookWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Give "${hook.title}" a new URL? The current one stops working at once.`)) return;

        set_busy(true);
        set_status(undefined);

        const res = await postAdminApi<BotHookWithToken>({ path: "hooks/rotate-hook", body: { hook_id: hook.id } });

        set_busy(false);

        if (!res.success || !res.singleRes) {
            set_status({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ hook: res.singleRes.hook });

        if (res.singleRes.token) {
            set_view({ kind: "url", hook: res.singleRes.hook, token: res.singleRes.token });
        } else {
            set_status({ success: true, msg: res.msg || "Done." });
        }
    };

    const remove = async ({ hook }: { hook: BotHookWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Delete the hook "${hook.title}"? Its URL stops working; a run already started carries on.`)) {
            return;
        }

        set_busy(true);
        set_status(undefined);

        const res = await postAdminApi({ path: "hooks/delete-hook", body: { hook_id: hook.id } });

        set_busy(false);

        if (!res.success) {
            set_status({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setHooks((prev) => prev.filter((h) => h.id != hook.id));
        set_status({ success: true, msg: "Deleted." });
    };

    const heading =
        view?.kind == "create"
            ? "New hook"
            : view?.kind == "calls"
              ? `Calls to ${view.hook.title || "the hook"}`
              : view
                ? view.hook.title || "Hook"
                : title;

    const intro =
        view?.kind == "create" || view?.kind == "edit"
            ? `Every call to the hook's URL gives ${name} this brief as a task, with what the caller sent, and the result lands here.`
            : view?.kind == "url"
              ? `The hook's URL is its key.`
              : view?.kind == "calls"
                ? `The latest calls and what became of each.`
                : `Ways for the outside to give ${name} work${workspace?.id ? ` in ${place}` : ""}: a URL a service (a webhook, a script) calls, or the browser notifications on one of its computers. Each call is a task, and its result lands here.`;

    return (
        <Modal
            target={<HeaderMenuItem icon={Webhook} title="Hooks" description={title} loading={loading} />}
            targetWrapperProps={{ className: "w-full" }}
            open={open}
            setOpen={(next) => {
                set_open(next);
                if (!next) back();
            }}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <H2 className="grow text-lg! leading-6! tracking-normal! font-bold text-ink">{heading}</H2>
                    {view && view.kind != "url" ? (
                        <Button
                            title="Back to the list"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={back}
                            className="px-2! text-[12px]"
                        >
                            Back
                        </Button>
                    ) : !view ? (
                        <Button
                            title="Make a hook"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={() => set_view({ kind: "create" })}
                            className="gap-1! px-2! text-[12px]"
                        >
                            <Plus size={14} aria-hidden />
                            New hook
                        </Button>
                    ) : null}
                </Row>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">{intro}</Span>
            </Stack>

            <Stack className="mt-4 max-h-[55vh] w-full gap-0! items-stretch overflow-y-auto">
                {view?.kind == "create" || view?.kind == "edit" ? (
                    <HookForm
                        key={view.kind == "edit" ? view.hook.id : "new"}
                        hook={view.kind == "edit" ? view.hook : undefined}
                        bot_id={Number(bot.id)}
                        workspace_id={workspace?.id ? Number(workspace.id) : null}
                        computers={pageProps?.bot_computers || []}
                        onCancel={back}
                        onSaved={({ hook, token, watch, msg }) => {
                            replace({ hook });

                            if (token) {
                                set_view({ kind: "url", hook, token });
                                return;
                            }

                            back();
                            set_status({ success: !watch || watch.ok, error: Boolean(watch && !watch.ok), msg: msg || "Saved." });
                        }}
                    />
                ) : view?.kind == "url" ? (
                    <HookUrlNotice token={view.token} signed={Boolean(view.hook.has_signing_secret)} onDone={back} />
                ) : view?.kind == "calls" ? (
                    <HookCalls hook_id={Number(view.hook.id)} />
                ) : (
                    <SettingsList is_empty={!hooks.length} empty={loading ? "Loading hooks..." : error || "No hooks here yet."}>
                        {hooks.map((hook) => (
                            <HookRow
                                key={hook.id}
                                hook={hook}
                                compact
                                busy={busy}
                                onToggle={() => toggle({ hook }).catch(() => {})}
                                onEdit={() => set_view({ kind: "edit", hook })}
                                onCalls={() => set_view({ kind: "calls", hook })}
                                onRotate={() => rotate({ hook }).catch(() => {})}
                                onDelete={() => remove({ hook }).catch(() => {})}
                            />
                        ))}
                    </SettingsList>
                )}
            </Stack>

            <Stack className="mt-3 gap-1! items-stretch">
                <SettingsStatus status={status} />
            </Stack>
        </Modal>
    );
}
