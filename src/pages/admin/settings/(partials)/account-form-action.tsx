import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";

export default function AccountFormAction(
    _params: ReturnType<typeof useFormInit<BUN_SQLITE_COBBLE_USERS>>,
) {
    return (
        <>
            <Button title="Save Changes">Save Changes</Button>
        </>
    );
}