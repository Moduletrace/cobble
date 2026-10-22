import { useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type {
    EnvScope,
    EnvsMutationResult,
    KnownEnvStatus,
    PublicEnv,
} from "@/src/types";
import postEnvApi from "../../(functions)/post-env-api";
import EnvForm from "./env-form";
import EnvRowActions from "./env-row-actions";
import { twMerge } from "tailwind-merge";

type Props = {
    scope: EnvScope;
    /**
     * The saved env, if any. An app setting may have none yet.
     */
    env?: PublicEnv;
    known?: KnownEnvStatus;
    /**
     * The bot or workspace's own list (its settings page) rather than the
     * Environment page's overview.
     */
    scoped?: boolean;
    onChanged: (data: EnvsMutationResult, msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * One env: its key, description and value (or "secret"), with Edit and
 * Remove. Edit opens the form in place.
 */
export default function EnvRow({
    scope,
    env,
    known,
    scoped,
    onChanged,
    onError,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const key = env?.key || known?.key || "";

    const remove = async () => {
        if (!env || busy) return;
        if (
            !window.confirm(
                `Remove ${key}? Computers drop it on their next run.`,
            )
        )
            return;

        setBusy(true);
        const res = await postEnvApi({
            path: "delete-env",
            body: { env_id: env.id, scoped },
        });
        setBusy(false);

        if (res.success && res.singleRes)
            onChanged(res.singleRes, res.msg || "Removed.");
        else onError(res.msg || "Couldn't remove the env.");
    };

    if (editing) {
        return (
            <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
                <EnvForm
                    scope={scope}
                    env={env}
                    known={known}
                    onSaved={(data, msg) => {
                        setEditing(false);
                        onChanged(data, msg);
                    }}
                    onCancel={() => setEditing(false)}
                />
            </Stack>
        );
    }

    const status = env
        ? env.secret
            ? "Secret, saved"
            : env.value || "Empty"
        : known?.from_process
          ? "From the server's environment"
          : "Not set";

    const flags =
        env && !env.known && !env.expose_to_computers
            ? " · not on computers"
            : "";

    return (
        <Row
            className={twMerge(
                "w-full gap-3! flex-nowrap items-start justify-between py-3 px-4",
                "border-0 border-b border-solid border-hairline last:border-b-0",
            )}
        >
            <Stack className="gap-0.5! min-w-0">
                <Span className="text-sm font-bold leading-5 text-ink truncate">
                    {key}
                </Span>
                {env?.description || known?.description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary break-words">
                        {known?.description || env?.description}
                    </Span>
                ) : null}
                <Span className="text-[13px] leading-[18px] text-ink-secondary break-all">
                    {status}
                    {flags}
                </Span>
            </Stack>
            <EnvRowActions
                name={key}
                mode={env ? "edit" : "set"}
                busy={busy}
                onEdit={() => setEditing(true)}
                onRemove={env ? remove : undefined}
            />
        </Row>
    );
}
