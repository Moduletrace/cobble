import grabLetter from "@/src/functions/backend/db/documents/grab-letter";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const letter_id = params.query?.id;

    if (!letter_id) {
        return {
            redirect: {
                destination: "/admin/letters",
            },
        };
    }

    const letter_res = await grabLetter({ id: letter_id });

    if (!letter_res.singleRes) {
        return {
            redirect: {
                destination: "/admin/letters",
            },
        };
    }

    return {
        props: {
            letter: letter_res.singleRes,
        },
    };
};