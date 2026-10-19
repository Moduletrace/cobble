import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";

type Props = {
    /**
     * Editing someone: both may stay empty to keep their password.
     */
    optional?: boolean;
    onPassword: (password: string) => void;
    onConfirm: (password: string) => void;
};

/**
 * The password section of the user form: the password, then the same
 * again to confirm it.
 */
export default function UserPasswordFields({ optional, onPassword, onConfirm }: Props) {
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
                onChange={(e) => onPassword(e.target.value)}
            />
            <Input
                id="user-form-confirm-password"
                title="Confirm password"
                label="Confirm password"
                showLabel
                type="password"
                placeholder="The same password again"
                autoComplete="new-password"
                onChange={(e) => onConfirm(e.target.value)}
            />
        </Stack>
    );
}
