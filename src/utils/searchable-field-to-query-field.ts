import type { ApiReqParams } from "../types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "../types/sql-joins";

export default function searchableFieldToQueryField({
    field,
}: {
    field: keyof BUN_SQLITE_COBBLE_USERS_JOIN;
}): keyof ApiReqParams {
    switch (field) {
        case "email":
            return "search_term_email";
        case "last_name":
            return "search_term_last_name";
        case "user_types":
            return "search_term_user_type";
        case "first_name":
        default:
            return "search_term_first_name";
    }
}
