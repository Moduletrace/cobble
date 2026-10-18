import { AppData } from "@/src/data/app-data";
import userAuth from "@/src/functions/backend/auth/user-auth";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { deleteCookies } from "@/src/utils/cookies";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (user?.id) {
        await logEvent({
            title: "User logged out",
            category: "auth",
            user_id: user.id,
            plain_text: `User #${user.id} [${user.first_name} ${user.last_name}] logged out.`,
            metadata: {
                user_id: user.id,
            },
            ip_address: grabRequestIP(req),
        });
    }

    return {
        res_transform(res) {
            const new_res = res.clone();
            deleteCookies(new_res, [
                {
                    name: AppData["AuthKeyCookieName"],
                    httpOnly: true,
                },
                {
                    name: AppData["AuthCSRFCookieName"],
                    httpOnly: true,
                },
            ]);
            return new_res;
        },
    };
};
