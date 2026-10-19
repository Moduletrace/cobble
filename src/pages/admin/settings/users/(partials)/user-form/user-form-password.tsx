import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";

/**
 * The password, then the same again to confirm it. Editing someone, both
 * may stay empty to keep theirs.
 */
export default function UserFormPassword({ setForm, existing_full }: ReturnType<typeof useFormInit<UserFormObject>>) {
    const optional = Boolean(existing_full?.id);

    return (
        <Stack className="w-full gap-3! items-stretch pt-2 border-0 border-t border-solid border-hairline">
            <Stack className="gap-0.5!">
                <Span className="text-sm font-bold leading-5 text-ink">{optional ? "New password" : "Password"}</Span>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`At least ${AppData.PasswordMinLength} characters.${optional ? " Leave both empty to keep theirs." : " They sign in with it."}`}
                </Span>
            </Stack>
            <Input
                id="user-form-password"
                title="Password"
                label="Password"
                showLabel
                type="password"
                placeholder={optional ? "Leave empty to keep it" : "A strong password"}
                autoComplete="new-password"
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            <Input
                id="user-form-confirm-password"
                title="Confirm password"
                label="Confirm password"
                showLabel
                type="password"
                placeholder="The same password again"
                autoComplete="new-password"
                onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
            />
        </Stack>
    );
}
