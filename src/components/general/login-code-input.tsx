import Input from "@moduletrace/twui/form/Input";

type Props = {
    onCodeChange: (code: string) => void;
};

export default function LoginCodeInput({ onCodeChange }: Props) {
    return (
        <Input
            id="code"
            name="code"
            type="text"
            label="Code"
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            onChange={(e) => {
                onCodeChange(e.target.value);
            }}
            showLabel
            required
        />
    );
}
