import { useState } from "react";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Divider from "@moduletrace/twui/layout/Divider";
import CodeEditor from "@/src/components/general/code-editor";
import HookPlaceFields from "@/src/components/general/hook-place-fields";
import {
    BotHookSignatureFormats,
    BotHookSources,
    type BotHookSignatureFormat,
    type BotHookSource,
} from "@/src/dict/bot-hook-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type {
    BotHookWithNames,
    BotHookWithToken,
    NotifyWatchSync,
} from "@/src/types";

type Props = {
    /**
     * The hook to edit; left out to make one for `bot_id` there.
     */
    hook?: BotHookWithNames;
    bot_id: number;
    /**
     * Where a new hook runs at first (the conversation it's made from);
     * the form can pick another place.
     */
    workspace_id?: number | null;
    /**
     * The bot's computers there, for a new browser-notification hook. Left
     * out (or empty), only URL hooks can be made.
     */
    computers?: { id?: number | ""; name?: string }[];
    /**
     * Crew managers also set the process the app keeps running for the hook
     * (its runner); everyone else never sees that part of the form.
     */
    can_manage?: boolean;
    onCancel: () => void;
    /**
     * `token` only for a new URL hook: its URL, shown once. `watch` for a
     * new notification hook: how setting up its computer went. `msg` is
     * what the save said.
     */
    onSaved: (params: {
        hook: BotHookWithNames;
        token?: string;
        watch?: NotifyWatchSync;
        msg?: string;
    }) => void;
};

/**
 * A hook's name and brief, where it runs (the bot's own chat or one of
 * its workspaces), what calls it (its URL, or a computer's browser
 * notifications, chosen once when it's made), and then either whether its
 * calls must be signed (the secret, the header it comes in and how it's
 * written) or which notifications it takes, and whether its runs take
 * over the conversation or stay in the hook's own thread. Makes a hook or edits one; a
 * saved secret is never shown again, so leaving it blank keeps it.
 */
export default function HookForm({
    hook,
    bot_id,
    workspace_id,
    computers = [],
    can_manage = false,
    onCancel,
    onSaved,
}: Props) {
    const [source, setSource] = useState<BotHookSource>(
        (hook?.source as BotHookSource) || "url",
    );
    const [watch_computer_id, setWatchComputerId] = useState(
        hook?.watch_computer_id
            ? Number(hook.watch_computer_id)
            : Number(computers[0]?.id) || 0,
    );
    const [watch_filter, setWatchFilter] = useState(hook?.watch_filter || "");
    const [title, setTitle] = useState(hook?.title || "");
    const [instructions, setInstructions] = useState(hook?.instructions || "");
    const [signed, setSigned] = useState(Boolean(hook?.has_signing_secret));
    const [silent, setSilent] = useState(Boolean(hook?.silent));
    const [secret, setSecret] = useState("");
    const [header, setHeader] = useState(
        hook?.signature_header || "X-Hub-Signature-256",
    );
    const [format, setFormat] = useState<BotHookSignatureFormat>(
        (hook?.signature_format as BotHookSignatureFormat) || "sha256=hex",
    );
    const [place, setPlace] = useState<{ workspace_id: number | null }>({
        workspace_id: hook
            ? Number(hook.workspace_id) || null
            : workspace_id || null,
    });
    const [runner_command, setRunnerCommand] = useState(
        hook?.runner_command || "",
    );
    const [runner_dir, setRunnerDir] = useState(hook?.runner_dir || "");
    const [runner_computer_id, setRunnerComputerId] = useState(
        Number(hook?.runner_computer_id) || 0,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const watching = source == "browser_notifications";
    const keeps_runner = can_manage && !watching && Boolean(runner_command.trim());

    /**
     * The runner is the crew manager's: the fields go only when they're
     * shown, so a member's save never clears one by accident.
     */
    const runner = !can_manage || watching
        ? {}
        : {
              runner_command: runner_command.trim() || null,
              runner_dir: runner_dir.trim(),
              runner_computer_id: keeps_runner
                  ? runner_computer_id || null
                  : null,
          };

    const signing = (() => {
        if (watching) return {};
        if (!signed)
            return hook?.has_signing_secret ? { signing_secret: null } : {};

        return {
            ...(secret.trim() ? { signing_secret: secret } : {}),
            signature_header: header,
            signature_format: format,
        };
    })();

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save ${title || "this hook"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = hook
            ? await postAdminApi<BotHookWithNames>({
                  path: "hooks/update-hook",
                  body: {
                      hook_id: hook.id,
                      title,
                      instructions,
                      workspace_id: place.workspace_id,
                      silent,
                      ...signing,
                      ...runner,
                      ...(watching ? { watch_filter } : {}),
                  },
              })
            : await postAdminApi<BotHookWithToken>({
                  path: "hooks/create-hook",
                  body: {
                      bot_id,
                      workspace_id: place.workspace_id,
                      title,
                      instructions,
                      silent,
                      source,
                      ...signing,
                      ...runner,
                      ...(watching ? { watch_computer_id, watch_filter } : {}),
                  },
              });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the hook.");
            return;
        }

        if ("hook" in res.singleRes) {
            onSaved({
                hook: res.singleRes.hook,
                token: res.singleRes.token,
                watch: res.singleRes.watch,
                msg: res.msg,
            });
        } else {
            onSaved({ hook: res.singleRes, msg: res.msg });
        }
    };

    return (
        // shrink-0: a capped flex column (the modal) would squash the form and clip the buttons away.
        <Form
            className="w-full shrink-0 gap-4! items-stretch pt-4 overflow-hidden px-1"
            onSubmit={submit}
        >
            <Input
                id="hook-title"
                title="Name"
                label="Name"
                showLabel
                autoComplete="off"
                placeholder="New GitHub issues"
                defaultValue={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <CodeEditor
                mode="markdown"
                className="h-40"
                title="Brief"
                content={instructions}
                info="What the bot does with each call. What the caller sends is added below this as data, never as instructions."
                onChange={(value) => setInstructions(value)}
            />
            <HookPlaceFields
                bot_id={bot_id}
                workspace_id={place.workspace_id}
                disabled={loading}
                onChange={setPlace}
            />
            {hook ? null : (
                <Select
                    id="hook-source"
                    title="What calls it"
                    label="What calls it"
                    showLabel
                    options={BotHookSources.filter(
                        (s) => s.value == "url" || computers.length,
                    ).map((s) => ({
                        value: s.value,
                        title: s.title,
                        default: s.value == source,
                    }))}
                    changeHandler={(value) =>
                        setSource(String(value) as BotHookSource)
                    }
                />
            )}
            {watching && !hook ? (
                <Select
                    id="hook-watch-computer"
                    title="Computer"
                    label="Computer"
                    showLabel
                    options={computers.map((c) => ({
                        value: String(c.id),
                        title: c.name || `Computer ${c.id}`,
                        default: Number(c.id) == watch_computer_id,
                    }))}
                    changeHandler={(value) => setWatchComputerId(Number(value))}
                />
            ) : null}
            {watching ? (
                <Input
                    id="hook-watch-filter"
                    title="Only notifications with"
                    label="Only notifications with"
                    showLabel
                    autoComplete="off"
                    placeholder="mail.google.com, invoice"
                    defaultValue={watch_filter}
                    info="Words in the site, title or text, comma-separated: any one is enough. Empty takes every notification. The site has to be allowed to send notifications in that computer's browser."
                    onChange={(e) => setWatchFilter(e.target.value)}
                />
            ) : null}
            {can_manage && !watching ? (
                <>
                    <Divider />
                    <Input
                        id="hook-runner-command"
                        title="Keep a process running"
                        label="Keep a process running"
                        showLabel
                        autoComplete="off"
                        placeholder="python3 whatsapp-bridge.py"
                        defaultValue={hook?.runner_command || ""}
                        info="The thing that calls this hook. A bridge started by hand dies with the computer's container, and the check every five minutes starts it again. It runs as this bot's account, in its folder, through bash -lc, so it has to stay in the foreground (no &). Leave empty for none."
                        onChange={(e) => setRunnerCommand(e.target.value)}
                    />
                    <Input
                        id="hook-runner-dir"
                        title="Runner's folder"
                        label="Runner's folder"
                        showLabel
                        autoComplete="off"
                        placeholder="whatsapp"
                        defaultValue={hook?.runner_dir || ""}
                        info={`Where it starts, inside the bot's folder: "whatsapp" is the bot's whatsapp folder. Empty starts in the bot's folder itself.`}
                        onChange={(e) => setRunnerDir(e.target.value)}
                    />
                    <Select
                        id="hook-runner-computer"
                        title="Runs the runner on"
                        label="Runs the runner on"
                        showLabel
                        options={[
                            {
                                value: "0",
                                title: "The bot's own computer",
                                default: !runner_computer_id,
                            },
                            ...computers.map((c) => ({
                                value: String(c.id),
                                title: c.name || `Computer ${c.id}`,
                                default: Number(c.id) == runner_computer_id,
                            })),
                        ]}
                        changeHandler={(value) =>
                            setRunnerComputerId(Number(value))
                        }
                    />
                </>
            ) : null}
            <Checkbox
                title="Run silently"
                label="Keep its runs in the hook's own thread: they never take over the conversation or notify me. Read them from the hook, or in the bot's sessions."
                checked={silent}
                changeHandler={setSilent}
                labelProps={{ className: "w-full" }}
            />
            {watching ? null : (
                <>
                    <Checkbox
                        title="Check signatures"
                        label="Only take calls signed with a secret (HMAC-SHA256 of the body, as GitHub and Stripe send)"
                        checked={signed}
                        changeHandler={setSigned}
                        labelProps={{
                            className: "w-full line-clamp-1 overflow-ellipsis",
                        }}
                    />
                    {signed ? (
                        <>
                            <Input
                                id="hook-secret"
                                title="Signing secret"
                                label="Signing secret"
                                showLabel
                                type="password"
                                autoComplete="new-password"
                                placeholder={
                                    hook?.has_signing_secret
                                        ? "Leave blank to keep the current secret"
                                        : ""
                                }
                                onChange={(e) => setSecret(e.target.value)}
                            />
                            <Input
                                id="hook-signature-header"
                                title="Signature header"
                                label="Signature header"
                                showLabel
                                autoComplete="off"
                                defaultValue={header}
                                onChange={(e) => setHeader(e.target.value)}
                            />
                            <Select
                                id="hook-signature-format"
                                title="Signature format"
                                label="Signature format"
                                showLabel
                                options={BotHookSignatureFormats.map((f) => ({
                                    value: f.value,
                                    title: f.title,
                                    default: f.value == format,
                                }))}
                                changeHandler={(value) =>
                                    setFormat(
                                        String(value) as BotHookSignatureFormat,
                                    )
                                }
                            />
                        </>
                    ) : null}
                </>
            )}
            <AddFormActions
                submit_label={hook ? "Save" : "Make hook"}
                loading={loading}
                error={error}
                onCancel={onCancel}
            />
        </Form>
    );
}
