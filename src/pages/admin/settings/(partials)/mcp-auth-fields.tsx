import { Plus } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { McpAuthSchemes, type McpAuthScheme } from "@/src/dict/mcp-dict";
import type { EnvKeyOption } from "@/src/types";
import type { McpAuth, McpHeaderLine } from "@/src/utils/mcp-headers";
import EnvValueField from "./envs/env-value-field";
import McpHeaderRow from "./mcp-header-row";

type Props = {
    id: string;
    auth: McpAuth;
    additional: McpHeaderLine[];
    onChange: (next: { auth: McpAuth; additional: McpHeaderLine[] }) => void;
    /**
     * The envs values can point at; left out where headers are never
     * filled in from envs (a browser's, which holds the user's own logins).
     */
    envs?: EnvKeyOption[];
    /**
     * Starts a new env for one value: the authorization's, or the added
     * header at that index.
     */
    onNewEnv?: (at: "auth" | number) => void;
    /**
     * A line on how values are stored, under the authorization choice.
     */
    info?: string;
};

/**
 * How a remote MCP server or a browser is told who is calling, and any
 * other header it needs: a choice and simple fields, rather than one block
 * of `Name: value` lines. What it adds up to is what `composeMcpHeaders`
 * stores.
 */
export default function McpAuthFields({ id, auth, additional, onChange, envs, onNewEnv, info }: Props) {
    const set_auth = (next: McpAuth) => onChange({ auth: next, additional });

    return (
        <Stack className="gap-4! items-stretch">
            <Select
                id={`${id}-auth`}
                title="Authorization"
                label="Authorization"
                showLabel
                options={McpAuthSchemes.map((scheme) => ({
                    value: scheme.value,
                    title: scheme.title,
                    default: scheme.value == auth.scheme,
                }))}
                value={auth.scheme}
                info={info}
                changeHandler={(value) => set_auth({ ...auth, scheme: String(value) as McpAuthScheme })}
            />
            {auth.scheme == "bearer" ? (
                <EnvValueField
                    id={`${id}-token`}
                    title="Token"
                    value={auth.secret}
                    envs={envs}
                    placeholder="{{env.GITHUB_TOKEN}}"
                    onChange={(secret) => set_auth({ ...auth, secret })}
                    onNewEnv={onNewEnv ? () => onNewEnv("auth") : undefined}
                />
            ) : null}
            {auth.scheme == "header" ? (
                <>
                    <Input
                        id={`${id}-header-name`}
                        title="Header name"
                        label="Header name"
                        showLabel
                        placeholder="X-API-Key"
                        value={auth.name}
                        autoComplete="off"
                        info="The header the server reads the token from."
                        onChange={(e) => set_auth({ ...auth, name: e.target.value })}
                    />
                    <EnvValueField
                        id={`${id}-header-value`}
                        title="Value"
                        value={auth.secret}
                        envs={envs}
                        placeholder="{{env.GITHUB_TOKEN}}"
                        onChange={(secret) => set_auth({ ...auth, secret })}
                        onNewEnv={onNewEnv ? () => onNewEnv("auth") : undefined}
                    />
                </>
            ) : null}
            <Stack className="gap-2! items-stretch">
                <Span className="text-[13px] font-bold leading-5 text-ink">Additional headers</Span>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Any other header the server needs. Basic auth is an Authorization header here.
                </Span>
                {additional.map((line, index) => (
                    <McpHeaderRow
                        key={`${id}-header-${index}`}
                        id={`${id}-header-${index}`}
                        line={line}
                        envs={envs}
                        onChange={(next) =>
                            onChange({
                                auth,
                                additional: additional.map((existing, at) => (at == index ? next : existing)),
                            })
                        }
                        onRemove={() => onChange({ auth, additional: additional.filter((_, at) => at != index) })}
                        onNewEnv={onNewEnv ? () => onNewEnv(index) : undefined}
                    />
                ))}
                <Button
                    title="Add another header"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={<Plus size={14} aria-hidden />}
                    className="self-start"
                    onClick={() => onChange({ auth, additional: [...additional, { name: "", value: "" }] })}
                >
                    Add header
                </Button>
            </Stack>
        </Stack>
    );
}