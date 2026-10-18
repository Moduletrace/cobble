import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn = async () => {
    return {
        redirect: {
            destination: "/auth/login",
            permanent: false,
        },
    };
};
