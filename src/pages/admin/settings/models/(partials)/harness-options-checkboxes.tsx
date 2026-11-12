import Checkbox from "@moduletrace/twui/form/Checkbox";
import type {
    HarnessOverview,
    HarnessFormValue,
    HarnessModelOption,
    HarnessProviderChoice,
} from "@/src/types";
import HarnessSeesImagesNote from "./harness-sees-images-note";

type Props = {
    harness: HarnessOverview;
    value: HarnessFormValue;
    provider?: HarnessProviderChoice;
    /**
     * The model the setting runs on (the pick, else what it runs on now).
     */
    model?: HarnessModelOption;
    falls_back_title?: string;
    onChange: (value: HarnessFormValue) => void;
};

/**
 * Toggles for a harness setting: automatic fallbacks, media reading, and enabled status.
 */
export default function HarnessOptionsCheckboxes({
    harness,
    value,
    provider,
    model,
    falls_back_title,
    onChange,
}: Props) {
    if (value.inherit) return null;

    return (
        <>
            {value.model_id && harness.automatic ? (
                <Checkbox
                    title="Fall back to the free automatic picks if this model fails"
                    label={`${harness.harness == "text" ? "Then fall back" : "Fall back"} to the free automatic picks${provider ? ` on ${provider.name}` : ""} if this model fails`}
                    checked={value.fallback}
                    changeHandler={(fallback) => onChange({ ...value, fallback })}
                />
            ) : null}
            {value.model_id && falls_back_title ? (
                <Checkbox
                    title={`Fall back to ${falls_back_title.toLowerCase()} if this model fails`}
                    label={`Fall back to ${falls_back_title.toLowerCase()} if this model fails`}
                    checked={value.fallback}
                    changeHandler={(fallback) => onChange({ ...value, fallback })}
                />
            ) : null}
            {harness.harness == "text" ? (
                <>
                    <Checkbox
                        title="Use the model's own media reading"
                        label="Use the model's own media reading"
                        info="It looks at images and screenshots itself when it takes image input. Otherwise the media reading model reads them."
                        checked={Boolean(value.sees_images)}
                        changeHandler={(sees_images) => onChange({ ...value, sees_images })}
                    />
                    {value.sees_images ? <HarnessSeesImagesNote model={model} /> : null}
                </>
            ) : null}
            {harness.required ? null : (
                <Checkbox
                    title={`Turn ${harness.title.toLowerCase()} on`}
                    label="Turned on"
                    checked={value.enabled}
                    changeHandler={(enabled) => onChange({ ...value, enabled })}
                />
            )}
        </>
    );
}
