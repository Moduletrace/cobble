import { harnessFallbackTitle } from "@/src/dict/harness-dict";
import type { HarnessFormValue, HarnessOverview } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import harnessDefaultName from "../(utils)/harness-default-name";
import nextHarnessProviderValue from "../(utils)/next-harness-provider-value";
import HarnessCurrentModel from "./harness-current-model";
import HarnessModelSelect from "./harness-model-select";
import HarnessOptionsCheckboxes from "./harness-options-checkboxes";
import HarnessParamsButton from "./harness-params-button";
import HarnessProviderSelect from "./harness-provider-select";
import HarnessTextFallbacks from "./harness-text-fallbacks";
import HarnessVoiceControls from "./harness-voice-controls";

type Props = {
    harness: HarnessOverview;
    value: HarnessFormValue;
    onChange: (value: HarnessFormValue) => void;
};

/**
 * One harness: its provider, its model, text fallback models,
 * automatic fallback options, and voice controls for speech.
 */
export default function HarnessSettingGroup({ harness, value, onChange }: Props) {
    const id = `harness-${harness.harness}`;
    const provider = harness.providers.find((p) => p.id == value.provider_id);
    const models = value.provider_id
        ? harness.models.filter((model) => model.provider_id == value.provider_id)
        : harness.models;
    const picked = models.find((model) => model.id == value.model_id);
    const on_bot_page = harness.default !== undefined;
    const falls_back_title = harnessFallbackTitle({ harness: harness.harness });
    const default_name = harnessDefaultName({
        harness_default: harness.default,
        falls_back_title,
    });

    return (
        <SettingsGroup title={harness.title} description={harness.description}>
            <HarnessProviderSelect
                id={`${id}-provider`}
                providers={harness.providers}
                provider_id={value.provider_id}
                inherit={value.inherit}
                inherit_title={on_bot_page ? `Same as the default (now ${default_name})` : undefined}
                onChange={(next) =>
                    onChange(
                        nextHarnessProviderValue({
                            value,
                            next,
                            picked_provider_id: picked?.provider_id,
                        }),
                    )
                }
            />
            {value.inherit ? null : (
                <HarnessModelSelect
                    key={value.provider_id || "any"}
                    id={`${id}-model`}
                    models={models}
                    model_id={value.model_id}
                    provider_name={provider?.name}
                    automatic={harness.automatic}
                    falls_back_title={falls_back_title}
                    onChange={(model_id) => onChange({ ...value, model_id, voice: undefined })}
                />
            )}
            <HarnessTextFallbacks id={id} harness={harness} value={value} onChange={onChange} />
            <HarnessCurrentModel
                harness={value.inherit && harness.default ? { ...harness, ...harness.default } : harness}
            />
            <HarnessOptionsCheckboxes
                harness={harness}
                value={value}
                provider={provider}
                falls_back_title={falls_back_title}
                onChange={onChange}
            />
            <HarnessParamsButton
                id={id}
                harness={harness.harness}
                inherit={value.inherit}
                model={picked || harness.current}
                params={value.params}
                onChange={(params) => onChange({ ...value, params })}
            />
            {!value.inherit && harness.harness == "speech" ? (
                <HarnessVoiceControls
                    id={id}
                    voices={(picked || harness.current)?.voices}
                    voice={value.voice}
                    model_id={picked?.id}
                    onChange={(voice) => onChange({ ...value, voice })}
                />
            ) : null}
        </SettingsGroup>
    );
}
