import HarnessVoiceSelect from "./harness-voice-select";
import HarnessVoicePreview from "./harness-voice-preview";

type Props = {
    id: string;
    voices?: string[];
    voice?: string;
    model_id?: number | null;
    onChange: (voice?: string) => void;
};

/**
 * Voice selection and audio sample preview for the speech harness.
 */
export default function HarnessVoiceControls({
    id,
    voices,
    voice,
    model_id,
    onChange,
}: Props) {
    return (
        <>
            {voices?.length ? (
                <HarnessVoiceSelect
                    id={`${id}-voice`}
                    voices={voices}
                    voice={voice}
                    onChange={(picked) => onChange(picked || undefined)}
                />
            ) : null}
            {model_id ? (
                <HarnessVoicePreview model_id={model_id} voice={voice} />
            ) : null}
        </>
    );
}
