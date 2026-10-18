import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";

export const server: BunextPageServerFn = async () => {
    return {
        redirect: {
            destination: SettingsDefaultPath,
            permanent: false,
        },
    };
};
