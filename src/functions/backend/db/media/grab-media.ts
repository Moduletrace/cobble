import type { BUN_SQLITE_BSQLITE_MEDIA } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { ApiReqParams, User } from "@/src/types";
import type { BUN_SQLITE_BSQLITE_MEDIA_JOIN } from "@/src/types/sql-joins";
import BunSQLite, { type APIResponseObject } from "@moduletrace/bun-sqlite";
import type { SQLInsertGenValueType } from "@moduletrace/bun-sqlite";
import _ from "lodash";
import appendUsersToMedia from "./append-users-to-media";

type Params = {
    query?: ApiReqParams;
    user?: User;
};

export default async function grabMedia(
    params?: Params,
): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_MEDIA_JOIN>> {
    const { query, user } = params || {};

    try {
        const LIMIT = AppData["DefaultQueryLimit"];
        const values: SQLInsertGenValueType[] = [];
        const hasParadigms = Boolean(query?.media_paradigms?.length);

        let sql = `SELECT\n`;
        sql += `    m.*,\n`;
        sql += `    GROUP_CONCAT(DISTINCT mp.media_paradigm) AS media_paradigms\n`;
        sql += `FROM media m\n`;
        sql += `LEFT JOIN media_paradigms mp ON m.id = mp.media_id\n`;

        sql += `WHERE COALESCE(m.archived, 0) <> 1\n`;

        if (hasParadigms && query?.media_paradigms) {
            const placeholders = query.media_paradigms.map(() => "?").join(",");
            sql += `    AND m.id IN (\n`;
            sql += `        SELECT sub_mp.media_id\n`;
            sql += `        FROM media_paradigms sub_mp\n`;
            sql += `        WHERE sub_mp.media_paradigm IN (${placeholders})\n`;
            sql += `        GROUP BY sub_mp.media_id\n`;
            sql += `        HAVING COUNT(DISTINCT sub_mp.media_paradigm) = ?\n`;
            sql += `    )\n`;

            values.push(...query.media_paradigms, query.media_paradigms.length);
        }

        if (query?.is_media_private) {
            sql += `    AND m.is_private = 1\n`;
            if (!user?.id) {
                throw new Error(`Private media requires authenticated user`);
            } else {
                sql += `    AND m.user_id = ?\n`;
                values.push(user.id);
            }
        } else {
            sql += `    AND COALESCE(m.is_private, 0) <> 1\n`;
        }

        if (query?.id) {
            sql += `    AND m.id = ?\n`;
            values.push(query.id);
        }

        if (query?.is_media_primary) {
            sql += `    AND m.is_primary = ?\n`;
            values.push(1);
        }

        if (query?.user_id) {
            sql += `    AND m.user_id = ?\n`;
            values.push(query.user_id);
        }

        // 4. Parameterized Search Terms
        if (query?.search_terms?.length) {
            const fields_to_search: (keyof BUN_SQLITE_BSQLITE_MEDIA)[] = [
                "title",
                "description",
                "summary",
                "text_content",
            ];

            const searchConditions: string[] = [];

            for (const search_term of query.search_terms) {
                const termConditions: string[] = [];
                for (const field of fields_to_search) {
                    termConditions.push(`m.${field} LIKE ?`);
                    values.push(`%${search_term}%`);
                }
                searchConditions.push(`(${termConditions.join(" OR ")})`);
            }

            sql += `    AND (${searchConditions.join(" OR ")})\n`;
        }

        sql += `GROUP BY m.id\n`;

        sql += `ORDER BY m.id DESC\n`;

        let sql_limit = `LIMIT ?`;
        const limitValues: SQLInsertGenValueType[] = [LIMIT];

        if (query?.page && query.page > 1) {
            const offset = LIMIT * (query.page - 1);
            sql_limit += ` OFFSET ?`;
            limitValues.push(offset);
        }

        const final_sql = `${sql}\n${sql_limit}`;
        const final_values = [...values, ...limitValues];

        const res = await BunSQLite.sql<BUN_SQLITE_BSQLITE_MEDIA_JOIN>({
            sql: final_sql,
            values: final_values,
        });

        // Count Query
        if (query?.count) {
            const count_sql = `SELECT COUNT(*) AS count FROM (${sql}) AS subquery_count`;
            const count_res = await BunSQLite.sql<{ count: number }>({
                sql: count_sql,
                values,
            });
            res.count = count_res.singleRes?.count ?? 0;
        }

        return await appendUsersToMedia({ media_res: res });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
