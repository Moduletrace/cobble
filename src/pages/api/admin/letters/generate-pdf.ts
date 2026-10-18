import grabLetter from "@/src/functions/backend/db/documents/grab-letter";
import generateLetterPdf from "@/src/functions/backend/pdf/letter-pdf";
import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import twuiSlugify from "@moduletrace/twui/utils/slugify";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    try {
        const body = params.body as ApiReqParams;

        const { user, user_types } = await userAuth({ req: params.req });

        if (!user?.logged_in_status) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        const access = checkUserAccess({
            user_types,
            includes: ["admin"],
        });

        if (!access.success) {
            return access;
        }

        const letter_id = body?.letter_id;

        if (!letter_id) {
            throw new Error(`Letter not found`);
        }

        const letter_res = await grabLetter({ id: letter_id });

        const letter = letter_res.singleRes;

        if (!letter) {
            throw new Error(`Letter not found`);
        }

        const pdf = await generateLetterPdf({
            template: letter,
            to_name: body?.to_name,
            to_address: body?.to_address,
            letter_date: body?.letter_date,
        });

        const filename = `${twuiSlugify(letter.title || "letter")}.pdf`;

        return new Response(new Uint8Array(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition":
                    `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};