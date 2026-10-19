import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import CodeEditor from "@/src/components/general/code-editor";
import { CustomToolHttpMethods, type CustomToolHttpMethod } from "@/src/dict/custom-tool-dict";
import type { CustomToolHttpConfig } from "@/src/types";
import parseTemplateLines, { templateLines } from "@/src/utils/parse-template-lines";
import TimeoutField from "./timeout-field";

type Props = {
    id: string;
    config: CustomToolHttpConfig;
    onChange: (config: CustomToolHttpConfig) => void;
};

/**
 * An HTTP tool's request: method, URL, headers and body, all templates.
 */
export default function HttpToolFields({ id, config, onChange }: Props) {
    return (
        <>
            <Select
                id={`${id}-method`}
                title="Method"
                label="Method"
                showLabel
                options={CustomToolHttpMethods.map((method) => ({
                    value: method,
                    title: method,
                    default: method == config.method,
                }))}
                changeHandler={(value) => onChange({ ...config, method: String(value) as CustomToolHttpMethod })}
            />
            <Input
                id={`${id}-url`}
                title="URL"
                label="URL"
                showLabel
                placeholder="https://api.example.com/weather?city={{args.city}}"
                defaultValue={config.url}
                autoComplete="off"
                info="{{args.name}} fills in an argument (URL-encoded), {{env.KEY}} an env."
                onChange={(e) => onChange({ ...config, url: e.target.value })}
            />
            <CodeEditor
                mode="properties"
                className="h-24"
                title="Headers"
                placeholder={"Authorization: Bearer {{env.WEATHER_KEY}}"}
                content={templateLines({ map: config.headers, separator: ":" })}
                info="One per line. Put secrets in Settings, under Environment: bots never see them."
                onChange={(value) =>
                    onChange({ ...config, headers: parseTemplateLines({ text: value, separator: ":" }) })
                }
            />
            {config.method == "GET" ? null : (
                <CodeEditor
                    mode="json"
                    className="h-28"
                    title="Body"
                    placeholder={'{"city": "{{args.city}}"}'}
                    content={config.body || ""}
                    info="Empty sends the arguments as JSON."
                    onChange={(value) => onChange({ ...config, body: value })}
                />
            )}
            <TimeoutField id={id} timeout_ms={config.timeout_ms} onChange={(timeout_ms) => onChange({ ...config, timeout_ms })} />
        </>
    );
}
