import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { BotHookWithNames, BotHookWithToken } from "@/src/types";
import useSettingsList from "@/src/pages/admin/settings/(hooks)/use-settings-list";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import HookCalls from "@/src/components/general/hook-calls";
import HookForm from "@/src/components/general/hook-form";
import HookRow from "@/src/components/general/hook-row";
import HookUrlNotice from "@/src/components/general/hook-url-notice";

/**
 * What the section's modal shows: a hook's form, its URL shown once, or
 * its recent calls.
 */
type View =
    | { kind: "edit"; hook: BotHookWithNames }
    | { kind: "url"; hook: BotHookWithNames; token: string }
    | { kind: "calls"; hook: BotHookWithNames };

/**
 * Every hook the user gave their bots: pause or resume one, edit it, see
 * its calls, give it a new URL, delete it. Hooks are made in a
 * conversation's Hooks modal, where their results land.
 */
export default function HooksSection() {
    const { pageProps } = useContext(AppContext);
    const { items, setItems, busy, setBusy, status, setStatus, remove } = useSettingsList({
        items: pageProps?.bot_hooks || [],
    });
    const [view, setView] = useState<View>();

    const replace = ({ hook }: { hook: BotHookWithNames }) =>
        setItems((prev) => prev.map((item) => (item.id == hook.id ? hook : item)));

    const toggle = async ({ hook }: { hook: BotHookWithNames }) => {
        setStatus(undefined);

        const res = await postAdminApi<BotHookWithNames>({
            path: "hooks/update-hook",
            body: { hook_id: hook.id, enabled: !hook.enabled },
        });

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ hook: res.singleRes });
        setStatus({ success: true, msg: res.msg });
    };

    const rotate = async ({ hook }: { hook: BotHookWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Give "${hook.title}" a new URL? The current one stops working at once.`)) return;

        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi<BotHookWithToken>({ path: "hooks/rotate-hook", body: { hook_id: hook.id } });

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ hook: res.singleRes.hook });

        if (res.singleRes.token) {
            setView({ kind: "url", hook: res.singleRes.hook, token: res.singleRes.token });
        } else {
            setStatus({ success: true, msg: res.msg || "Done." });
        }
    };

    const title =
        view?.kind == "url"
            ? `${view.hook.title || "Hook"}: new URL`
            : view?.kind == "calls"
              ? `Calls to ${view.hook.title || "the hook"}`
              : view?.hook.title || "Hook";

    return (
        <SettingsGroup
            title="Your hooks"
            description="Ways for the outside to give a bot work: a secret URL a service (a webhook, a script) calls, or a computer's browser notifications. Make one from a conversation's menu, under Hooks. Each call is a task, and its result lands in that conversation."
        >
            <SettingsList is_empty={!items.length} empty="No hooks yet.">
                {items.map((hook) => (
                    <HookRow
                        key={hook.id}
                        hook={hook}
                        busy={busy}
                        onToggle={() => toggle({ hook }).catch(() => {})}
                        onEdit={() => setView({ kind: "edit", hook })}
                        onCalls={() => setView({ kind: "calls", hook })}
                        onRotate={() => rotate({ hook }).catch(() => {})}
                        onDelete={() =>
                            remove({
                                id: hook.id,
                                path: "hooks/delete-hook",
                                body: { hook_id: hook.id },
                                confirm: `Delete the hook "${hook.title}"? Its URL stops working; a run already started carries on.`,
                            })
                        }
                    />
                ))}
            </SettingsList>
            <SettingsStatus status={status} />
            <AddModalShell open={Boolean(view)} setOpen={(open) => !open && setView(undefined)} title={title}>
                {view?.kind == "edit" ? (
                    <HookForm
                        key={view.hook.id}
                        hook={view.hook}
                        bot_id={Number(view.hook.bot_id)}
                        workspace_id={view.hook.workspace_id ? Number(view.hook.workspace_id) : null}
                        onCancel={() => setView(undefined)}
                        onSaved={({ hook }) => {
                            replace({ hook });
                            setView(undefined);
                            setStatus({ success: true, msg: "Saved." });
                        }}
                    />
                ) : view?.kind == "url" ? (
                    <HookUrlNotice
                        token={view.token}
                        signed={Boolean(view.hook.has_signing_secret)}
                        onDone={() => setView(undefined)}
                    />
                ) : view?.kind == "calls" ? (
                    <HookCalls hook_id={Number(view.hook.id)} />
                ) : null}
            </AddModalShell>
        </SettingsGroup>
    );
}
