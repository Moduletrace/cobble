import type { BUN_SQLITE_COBBLE_MEDIA_JOIN } from "@/src/types/sql-joins";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import _ from "lodash";
import grabUsers from "../users/grab-users";

type Params = {
    media_res: APIResponseObject<BUN_SQLITE_COBBLE_MEDIA_JOIN>;
};

export default async function appendUsersToMedia({
    media_res,
}: Params): Promise<APIResponseObject<BUN_SQLITE_COBBLE_MEDIA_JOIN>> {
    try {
        let new_media_res = _.cloneDeep(media_res);

        const media = new_media_res.payload;

        const users_ids = media
            ?.map((m) => m.user_id)
            .filter((n) => !_.isUndefined(n) && _.isNumber(n));

        const unique_users_ids = _.uniq(users_ids);

        if (users_ids?.[0] && media?.[0]) {
            const users_res = await grabUsers({
                query: { ids: unique_users_ids },
            });

            const users = users_res.payload || [];

            for (let i = 0; i < media.length; i++) {
                const single_media = media[i];
                const target_user = users.find(
                    (u) => u.id == single_media?.user_id,
                );

                if (!target_user || !single_media?.user_id) {
                    continue;
                }

                new_media_res.payload![i]!.user = target_user;

                if (i == 0) {
                    new_media_res.singleRes = target_user;
                }
            }
        }

        return new_media_res;
    } catch (error: any) {
        console.log("Append users to media ERROR =>", error.message);

        return media_res;
    }
}
