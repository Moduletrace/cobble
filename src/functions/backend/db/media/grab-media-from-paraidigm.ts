import type { BUN_SQLITE_COBBLE_MEDIA_PARADIGMS } from "@/db/types/db";
import type { MediaParadigmType, TableType } from "@/src/types";
import type { BUN_SQLITE_COBBLE_MEDIA_PARADIGMS_JOIN } from "@/src/types/sql-joins";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

type Params = {
    media_paradigm: MediaParadigmType;
    user_id?: string | number;
};

export default async function grabMediaFromParadigm({
    media_paradigm,
    user_id,
}: Params): Promise<APIResponseObject<BUN_SQLITE_COBBLE_MEDIA_PARADIGMS_JOIN>> {
    try {
        const media_paradigms_res = await BunSQLite.select<
            BUN_SQLITE_COBBLE_MEDIA_PARADIGMS,
            TableType
        >({
            table: "media_paradigms",
            query: {
                query: {
                    media_paradigm: {
                        value: media_paradigm,
                    },
                },
                join: [
                    {
                        joinType: "INNER JOIN",
                        tableName: "media",
                        match: [
                            {
                                source: "media_id",
                                target: "id",
                            },
                        ],
                        selectFields: ["user_id"],
                    },
                    {
                        joinType: "INNER JOIN",
                        tableName: "users",
                        match: [
                            {
                                source: {
                                    fieldName: "user_id",
                                    tableName: "media",
                                },
                                target: "id",
                            },
                            ...(user_id
                                ? [
                                      {
                                          source: {
                                              fieldName: "id",
                                              tableName: "users",
                                          },
                                          targetLiteral: user_id,
                                      },
                                  ]
                                : []),
                        ],
                        selectFields: ["first_name", "last_name"],
                    },
                ],
            },
        });

        return {
            ...media_paradigms_res,
            singleRes: media_paradigms_res.singleRes,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
