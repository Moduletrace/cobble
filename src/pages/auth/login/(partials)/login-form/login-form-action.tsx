import Button from "@moduletrace/twui/layout/Button";
import type { LoginMethod } from "@/src/types";

type Props = {
    method: LoginMethod;
};

export default function LoginFormAction({ method }: Props) {
    const label = method == "password" ? "Log in" : "Email me a login code";

    return (
        <Button title={label} type="submit" className="w-full">
            {label}
        </Button>
    );
}
