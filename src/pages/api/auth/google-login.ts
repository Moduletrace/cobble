import loginUser from "@/src/functions/backend/auth/login-user";
import verifyGoogleIdToken from "@/src/functions/backend/auth/verify-google-id-token";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import createSignupUser from "@/src/functions/backend/auth/create-signup-user";
import generateUniqueUsername from "@/src/functions/backend/auth/generate-unique-username";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { GoogleLoginRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        const { google_token, google_signup } = parseWithSchema({
            schema: GoogleLoginRequestSchema,
            data: body,
        });

        const googleClientId = process.env.GOOGLE_CLIENT_ID;

        if (!googleClientId) {
            throw new Error(`Google login is not configured on this server`);
        }

        const googleUser = await verifyGoogleIdToken({
            clientId: googleClientId,
            idToken: google_token,
        });

        const target_user_res = await grabUsers({
            query: {
                search_term_email: googleUser.email,
            },
            exact_match: true,
        });

        let target_user = target_user_res.singleRes;

        if (!target_user?.id && google_signup) {
            const new_user_id = await createSignupUser({
                first_name:
                    googleUser.given_name ||
                    googleUser.name?.split(" ")[0] ||
                    googleUser.email.split("@")[0] ||
                    "",
                last_name: googleUser.family_name,
                email: googleUser.email.toLowerCase(),
                username: await generateUniqueUsername({
                    email: googleUser.email,
                }),
            });

            await logEvent({
                title: "Google signup",
                category: "auth",
                user_id: new_user_id,
                plain_text: `User #${new_user_id} signed up with Google.`,
                metadata: {
                    user_id: new_user_id,
                },
                ip_address: grabRequestIP(req),
            });

            target_user = (
                await grabUsers({
                    query: { user_id: new_user_id },
                })
            ).singleRes;
        }

        if (!target_user?.id) {
            throw new AppError(
                `No account exists for ${googleUser.email}. Please sign up first.`,
            );
        }

        if (googleUser.picture && !target_user.profile_media_id) {
            const fullResUrl = googleUser.picture.replace(/=s\d+-c$/, "=s0");

            const res = await fetch(fullResUrl);

            if (res.ok) {
                const bytes = new Uint8Array(await res.arrayBuffer());

                await uploadAndRecordMedia({
                    data: bytes,
                    user: target_user,
                    media_paradigms: ["user-profile-image"],
                    media_type: "image",
                    is_primary: true,
                    media_name: `user-${target_user.id}-profile`,
                    media_mime_type: "jpeg",
                });
            }
        }

        return await loginUser({
            user_id: target_user.id,
            req,
        });
    } catch (error: unknown) {
        await logEvent({
            title: "Google login failed",
            category: "auth",
            plain_text: `Google login failed: ${
                error instanceof Error ? error.message : String(error)
            }`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
