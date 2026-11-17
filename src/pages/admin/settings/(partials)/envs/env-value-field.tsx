import { Plus } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { EnvKeyOption } from "@/src/types";
import { envKeyFromTemplate, envTemplate } from "@/src/utils/mcp-headers";

type Props = {
    id: string;
    /**
     * What the value is: "Token", "Value".
     */
    title: string;
    value: string;
    /**
     * The envs the value can point at, by key. Left out where values are
     * literal (a browser's headers are never filled in from envs): then
     * this is a plain input.
     */
    envs?: EnvKeyOption[];
    placeholder?: string;
    info?: string;
    onChange: (value: string) => void;
    /**
     * Adds one beside the picker; left out where a new env can't be made.
     */
    onNewEnv?: () => void;
};

/**
 * A value that is either typed in, or one of the general envs
 * (`{{env.KEY}}`, filled in when a bot connects, so the secret never sits
 * in this form). The picker lists what's set; a saved template whose env
 * is gone is still shown, so editing an old server never silently drops it.
 */
export default function EnvValueField({ id, title, value, envs, placeholder, info, onChange, onNewEnv }: Props) {
    if (!envs) {
        return (
            <Input
                id={`${id}-value`}
                title={title}
                label={title}
                showLabel
                placeholder={placeholder}
                value={value}
                info={info}
                autoComplete="off"
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    const chosen = envKeyFromTemplate({ text: value });
    const known = chosen ? envs.some((env) => env.key == chosen) : false;
    const options = [
        { value: "", title: "Type a value", default: !chosen },
        ...envs.map((env) => ({
            value: envTemplate(env.key),
            title: env.description ? `${env.key} - ${env.description}` : env.key,
            default: env.key == chosen,
        })),
    ];

    if (chosen && !known) {
        options.push({ value: envTemplate(chosen), title: `${chosen} (not set)`, default: true });
    }

    return (
        <Stack className="gap-2! items-stretch">
            <Row className="gap-2! items-end">
                <Select
                    id={`${id}-env`}
                    title={`${title} from Settings`}
                    label={`${title} from Settings`}
                    showLabel
                    options={options}
                    value={chosen ? envTemplate(chosen) : ""}
                    wrapperWrapperProps={{ className: "flex-1" }}
                    changeHandler={(next) => onChange(String(next))}
                />
                {onNewEnv ? (
                    <Button
                        title="Save a new env, then point this at it"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        beforeIcon={<Plus size={14} aria-hidden />}
                        onClick={onNewEnv}
                    >
                        New env
                    </Button>
                ) : null}
            </Row>
            {chosen ? (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {known
                        ? `${envTemplate(chosen)} fills in from Settings, under Environment, when a bot connects. Bots never see its value.`
                        : `${chosen} isn't set for everyone yet, so this won't connect until it is: add it in Settings, under Environment.`}
                </Span>
            ) : (
                <Input
                    id={`${id}-value`}
                    title={title}
                    label={title}
                    showLabel
                    placeholder={placeholder}
                    value={value}
                    info={info}
                    autoComplete="off"
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </Stack>
    );
}