import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";

export const server: BunextPageServerFn = async () => {
    return {
        redirect: {
            destination: AdminHomePath,
            permanent: false,
        },
    };
};
