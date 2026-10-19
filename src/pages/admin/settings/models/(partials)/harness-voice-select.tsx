import Select from "@moduletrace/twui/form/Select";

type Props = {
    id: string;
    voices: string[];
    voice?: string;
    onChange: (voice: string) => void;
};

/**
 * Voice for the speech harness, from the model's own voices.
 */
export default function HarnessVoiceSelect({ id, voices, voice, onChange }: Props) {
    return (
        <Select
            id={id}
            title="Voice"
            label="Voice"
            showLabel
            options={[
                { value: "", title: "The model's default", default: !voice },
                ...voices.map((name) => ({
                    value: name,
                    title: name,
                    default: name == voice,
                })),
            ]}
            changeHandler={(value) => onChange(value)}
        />
    );
}
