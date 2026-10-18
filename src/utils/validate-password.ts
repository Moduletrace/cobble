import { AppData } from "@/src/data/app-data";

type Params = {
    password?: string;
};

/**
 * Returns a user-facing error message, or `undefined` when the
 * password is acceptable.
 */
export default function validatePassword({ password }: Params) {
    if (!password) {
        return `Please enter a password`;
    }

    if (password.length < AppData["PasswordMinLength"]) {
        return `Passwords must be at least ${AppData["PasswordMinLength"]} characters`;
    }

    if (password.length > AppData["PasswordMaxLength"]) {
        return `Passwords can't be longer than ${AppData["PasswordMaxLength"]} characters`;
    }

    if (!password.trim()) {
        return `Passwords can't be only spaces`;
    }

    return undefined;
}
