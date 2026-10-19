import { AppData } from "@/src/data/app-data";
import type { ApiReqParams, SQLInsertGenValueType } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

type Params = {
    query?: ApiReqParams;
    /**
     * For search terms (ie `search_term_*`) parameters.
     * This forces all searches to `=` instead of `LIKE`
     */
    exact_match?: boolean;
    user_id?: string | number;
};

export default async function grabUsers(
    params?: Params,
): Promise<APIResponseObject<BUN_SQLITE_COBBLE_USERS_JOIN>> {
    const { query } = params || {};

    try {
        const LIMIT = AppData["DefaultQueryLimit"];

        let sql = ``;
        let values: SQLInsertGenValueType[] = [];

        sql += `SELECT\n`;
        sql += `    u.*,\n`;
        sql += `    ut_agg.user_types,\n`;
        /**
         * Their profile photo only: other primary media (a bot's picture)
         * must not stand in for it.
         */
        sql += `    (\n`;
        sql += `        SELECT m.id FROM media m\n`;
        sql += `        JOIN media_paradigms mp ON mp.media_id = m.id AND mp.media_paradigm = 'user-profile-image'\n`;
        sql += `        WHERE m.user_id = u.id AND m.is_primary = 1\n`;
        sql += `        ORDER BY m.id DESC LIMIT 1\n`;
        sql += `    ) AS profile_media_id\n`;
        sql += `FROM users u\n`;
        sql += `LEFT JOIN (\n`;
        sql += `    SELECT user_id, GROUP_CONCAT(DISTINCT user_type) AS user_types\n`;
        sql += `    FROM user_types\n`;
        sql += `    GROUP BY user_id\n`;
        sql += `) ut_agg ON u.id = ut_agg.user_id\n`;
        sql += `WHERE COALESCE(u.archived, 0) <> 1\n`;

        const target_user_id = params?.user_id || query?.user_id;

        if (target_user_id) {
            sql += `    AND u.id=?\n`;
            values.push(target_user_id);
        }

        if (query?.search_term_user_type) {
            sql += `    AND EXISTS (\n`;
            sql += `        SELECT 1 FROM user_types WHERE user_id = u.id AND user_type LIKE`;

            if (Array.isArray(query.search_term_user_type)) {
                sql += `(`;
                for (let i = 0; i < query.search_term_user_type.length; i++) {
                    const ut = query.search_term_user_type[i];
                    sql += ` ?`;
                    values.push(`%${ut}%`);
                }
                sql += `)`;
            } else {
                sql += ` ?`;
                values.push(`%${query.search_term_user_type}%`);
            }

            sql += `    )\n`;
        } else if (query?.target_user_type) {
            sql += `    AND EXISTS (
              SELECT 1 FROM user_types WHERE user_id = u.id AND user_type = ?
          )\n`;
            values.push(query.target_user_type);
        }

        let search_terms = [
            { field: "first_name", value: query?.search_term_first_name },
            { field: "last_name", value: query?.search_term_last_name },
            { field: "email", value: query?.search_term_email },
            { field: "id", value: query?.search_term_id },
        ] as const;

        for (const term of search_terms) {
            if (term.value) {
                const isId = term.field === "id";
                const match_value = params?.exact_match ? "=" : "LIKE";

                if (Array.isArray(term.value)) {
                    sql += `    AND (`;
                    for (let i = 0; i < term.value.length; i++) {
                        const term_value = term.value[i];
                        if (!term_value) continue;
                        const match_value_param = params?.exact_match
                            ? term_value
                            : `%${term_value.replace(/ /g, "%")}%`;

                        sql += ` u.${term.field} ${isId ? "=" : match_value} ?`;
                        if (i < term.value.length - 1) {
                            sql += ` OR`;
                        }
                        values.push(isId ? term_value : match_value_param);
                    }
                    sql += `    )\n`;
                } else {
                    const match_value_param = params?.exact_match
                        ? term.value
                        : `%${term.value.replace(/ /g, "%")}%`;
                    sql += `    AND u.${term.field} ${isId ? "=" : match_value} ?\n`;
                    values.push(isId ? term.value : match_value_param);
                }
            }
        }

        let sql_limit = ``;
        sql_limit += `LIMIT ${LIMIT}\n`;
        if (query?.page) {
            const offset = LIMIT * (query.page - 1);
            sql_limit += `OFFSET ${offset}\n`;
        }

        const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_USERS_JOIN>({
            sql: `${sql}\n${sql_limit}`,
            values,
        });

        if (query?.count) {
            const count_sql = `SELECT COUNT(*) AS count FROM (${sql}) x`;
            // const count_sql = `SELECT COUNT(*) AS count FROM users u WHERE u.archived IS NOT 1 ${
            //     query?.user_id ? "AND u.id = ?" : ""
            // }`;
            const count_res = await BunSQLite.sql({ sql: count_sql, values });
            res.count = count_res.singleRes?.count;
        }

        return res;
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
