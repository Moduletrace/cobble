import Button from "@moduletrace/twui/layout/Button";

type Props = {
    has_password: boolean;
};

export default function PasswordFormActions({ has_password }: Props) {
    const label = has_password ? "Change password" : "Set password";

    return (
        <Button title={label} type="submit">
            {label}
        </Button>
    );
}
