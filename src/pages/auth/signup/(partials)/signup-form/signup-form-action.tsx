import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";

export default function SignupFormAction({}: ReturnType<
    typeof useFormInit<SignupFormObject>
>) {
    return (
        <Button title="Create super admin" type="submit" className="w-full">
            Create super admin
        </Button>
    );
}