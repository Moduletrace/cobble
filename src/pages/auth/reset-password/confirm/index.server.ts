import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";

/**
 * Password resets only exist in password login mode.
 */
export const server: BunextPageServerFn = async () => {
    if (grabLoginMethod() != "password") {
        return {
            redirect: {
                destination: "/auth/login",
                permanent: false,
            },
        };
    }

    return {};
};
