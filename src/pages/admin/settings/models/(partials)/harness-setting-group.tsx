import Checkbox from "@moduletrace/twui/form/Checkbox";
import { HarnessParameterHarnesses } from "@/src/dict/harness-parameter-dict";
import type { HarnessFormValue, HarnessOverview } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import HarnessCurrentModel from "./harness-current-model";
import HarnessModelSelect from "./harness-model-select";
import HarnessParameterModal from "./harness-parameter-modal";
import HarnessProviderSelect from "./harness-provider-select";
import HarnessVoicePreview from "./harness-voice-preview";
import HarnessVoiceSelect from "./harness-voice-select";

type Props = {
    harness: HarnessOverview;
    value: HarnessFormValue;
    onChange: (value: HarnessFormValue) => void;
};

/**
 * One harness: its provider, then its model (narrowed to that provider),
 * whether it falls back to the automatic picks (for a harness that has
 * them), whether it's on, and its voice for speech, with a sample to hear
 * it before saving. On a bot's page the provider select can also use the
 * default, which hides the rest.
 */
export default function HarnessSettingGroup({ harness, value, onChange }: Props) {
    const id = `harness-${harness.harness}`;
    const provider = harness.providers.find((p) => p.id == value.provider_id);
    const models = value.provider_id
        ? harness.models.filter((model) => model.provider_id == value.provider_id)
        : harness.models;
    const picked = models.find((model) => model.id == value.model_id);
    const voices = (picked || harness.current)?.voices;
    /**
     * The model the settings are for: the pick, else the one it runs on now.
     */
    const params_model = picked || harness.current;
    const shows_params =
        !value.inherit &&
        HarnessParameterHarnesses.includes(
            harness.harness as (typeof HarnessParameterHarnesses)[number],
        );
    const on_bot_page = harness.default !== undefined;
    const default_name = harness.default?.enabled === false
        ? "turned off"
        : harness.default?.current
          ? `${harness.default.current.name} on ${harness.default.current.provider_name}`
          : "not available";

    return (
        <SettingsGroup title={harness.title} description={harness.description}>
            <HarnessProviderSelect
                id={`${id}-provider`}
                providers={harness.providers}
                provider_id={value.provider_id}
                inherit={value.inherit}
                inherit_title={on_bot_page ? `Same as the default (now ${default_name})` : undefined}
                onChange={(next) =>
                    onChange({
                        ...value,
                        ...next,
                        model_id:
                            next.provider_id && picked?.provider_id != next.provider_id
                                ? null
                                : value.model_id,
                        voice: undefined,
                    })
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
                    onChange={(model_id) => onChange({ ...value, model_id, voice: undefined })}
                />
            )}
            {value.inherit && harness.default ? (
                <HarnessCurrentModel harness={{ ...harness, ...harness.default }} />
            ) : (
                <HarnessCurrentModel harness={harness} />
            )}
            {!value.inherit && value.model_id && harness.automatic ? (
                <Checkbox
                    title="Fall back to the automatic picks if this model fails"
                    label={`Fall back to the automatic picks${provider ? ` on ${provider.name}` : ""} if this model fails`}
                    checked={value.fallback}
                    changeHandler={(fallback) => onChange({ ...value, fallback })}
                />
            ) : null}
            {shows_params && params_model ? (
                <HarnessParameterModal
                    id={id}
                    model={params_model}
                    params={value.params}
                    onChange={(params) => onChange({ ...value, params })}
                />
            ) : null}
            {!value.inherit && harness.harness == "speech" && voices?.length ? (
                <HarnessVoiceSelect
                    id={`${id}-voice`}
                    voices={voices}
                    voice={value.voice}
                    onChange={(voice) => onChange({ ...value, voice: voice || undefined })}
                />
            ) : null}
            {!value.inherit && harness.harness == "speech" && picked ? (
                <HarnessVoicePreview model_id={picked.id} voice={value.voice} />
            ) : null}
            {value.inherit || harness.required ? null : (
                <Checkbox
                    title={`Turn ${harness.title.toLowerCase()} on`}
                    label="Turned on"
                    checked={value.enabled}
                    changeHandler={(enabled) => onChange({ ...value, enabled })}
                />
            )}
        </SettingsGroup>
    );
}
