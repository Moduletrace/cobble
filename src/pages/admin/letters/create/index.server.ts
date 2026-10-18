import type { PagePropsType } from "@/src/types";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const user_types = params.props?.user_types;

    if (isReadOnlyUser({ user_types })) {
        return {
            redirect: {
                destination: "/admin/letters",
            },
        };
    }

    return {};
};