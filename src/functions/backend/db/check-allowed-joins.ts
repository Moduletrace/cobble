import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import type { TableType } from "@/src/types";
import uniqueStringArr from "@/src/utils/unique-string-arr";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

type Params = {
    /**
     * Allowed joins
     */
    joins: TableType[];
    query: ServerQueryParam<any>;
    /**
     * Allowed fields from joins
     */
    include_fields?: (keyof BUN_SQLITE_BSQLITE_ALL_TYPEDEFS)[];
    /**
     * Fields to exclude from joins
     */
    exclude_fields?: (keyof BUN_SQLITE_BSQLITE_ALL_TYPEDEFS)[];
};

export default function checkAllowedJoins({
    joins,
    query,
    include_fields,
    exclude_fields,
}: Params): APIResponseObject {
    const all_joins = BunSQLite.utils.grab_join_fields_from_query_object({
        query,
    });

    const all_joins_str_arr = uniqueStringArr(
        all_joins
            .filter((j) => Boolean(j.table))
            .map((j) => j.table) as string[],
    );

    const are_joins_allowed =
        _.intersection(joins, all_joins_str_arr).length >=
        all_joins_str_arr.length;

    if (!are_joins_allowed) {
        return {
            success: false,
            msg: `Can't Join all tables: \`${all_joins_str_arr.join(", ")}\`. Tables allowed are \`${joins.join(", ")}\``,
        };
    }

    if (include_fields?.[0]) {
        for (let i = 0; i < all_joins.length; i++) {
            const join = all_joins[i];
            if (!join) continue;
            const join_field = join.field as keyof BUN_SQLITE_BSQLITE_ALL_TYPEDEFS;
            if (!include_fields.includes(join_field)) {
                return {
                    success: false,
                    msg: `Can't Join field: \`${join_field}\` in \`${join.table}\` table`,
                };
            }
        }
    }

    return {
        success: true,
    };
}
