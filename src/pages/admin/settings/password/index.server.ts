import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    if (grabLoginMethod() != "password") {
        return {
            redirect: {
                destination: "/admin/settings",
            },
        };
    }

    return await grabSettingsServerProps(params);
};
