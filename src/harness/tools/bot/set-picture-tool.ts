import { z } from "zod";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";
import grabPictureSource from "@/src/functions/backend/db/profile-images/grab-picture-source";
import setBotPicture from "@/src/functions/backend/db/profile-images/set-bot-picture";
import parseFileRef from "@/src/utils/parse-file-ref";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot running: it sets its own picture unless the coordinator names
     * another worker.
     */
    bot_id: number | string;
    /**
     * The files this run reaches (`grabRunScopes`), so a picture is only
     * ever copied from a file the bot could already read.
     */
    scopes: StorageScope[];
    /**
     * Whether the run is the coordinator, which may dress any worker.
     */
    is_coordinator?: boolean;
};

type Args = {
    file_id?: string | number;
    media_id?: number;
    bot_id?: number;
    remove?: boolean;
};

/**
 * Lets a bot set its own picture from a file it can see, and the
 * coordinator set any worker's: an avatar in its place in the rail, in the
 * thread and in the crew list. Only a super admin or an admin sets one
 * (`setBotPicture` checks it), so a run for anyone else is told so.
 */
export default function setPictureTool({
    user_id,
    bot_id,
    scopes,
    is_coordinator,
}: Params): HarnessTool<Args> {
    return {
        name: "set_picture",
        description: `Set a bot's picture (its avatar, shown in the rail and beside its messages) from an image in your files, or remove it. You set your own; ${
            is_coordinator ? "as the coordinator you can pass bot_id to dress a worker" : "only the coordinator sets another bot's"
        }. Give \`file_id\` with the image's [file:ID] ref, e.g. "[file:12]" (list_files shows them; what the user sends you lands in uploads/), or \`media_id\` for an image they uploaded. An SVG or another kind of file is turned into a PNG first, then that file is used. The picture has to be an image and at most 5 MB; a square one looks best.`,
        schema: z
            .object({
                file_id: z
                    .union([z.string().max(60), z.number().int().positive()])
                    .optional()
                    .describe(`The image's [file:ID] ref, e.g. "[file:12]"`),
                media_id: z
                    .number()
                    .int()
                    .positive()
                    .optional()
                    .describe(`An image the user uploaded, by media id`),
                bot_id: is_coordinator
                    ? z
                          .number()
                          .int()
                          .positive()
                          .optional()
                          .describe(`The worker to dress; leave it out for your own picture`)
                    : z.number().int().positive().optional(),
                remove: z.boolean().optional().describe(`Take the picture away`),
            })
            .refine(
                (args) =>
                    Boolean(args.remove) ||
                    Boolean(args.file_id) ||
                    Boolean(args.media_id),
                "Give the image's file_id or media_id, or set remove.",
            ),
        run: async ({ args }) => {
            const target = args.bot_id ?? Number(bot_id);

            if (Number(target) != Number(bot_id) && !is_coordinator) {
                throw new Error(
                    `You can only set your own picture. The coordinator sets another bot's.`,
                );
            }

            const media = args.remove
                ? null
                : await grabPictureSource({
                      user_id,
                      scopes,
                      file_id: parseFileRef({ ref: args.file_id }),
                      media_id: args.media_id,
                  });

            if (!args.remove && !media) {
                throw new Error(
                    `Give the image's [file:ID] ref or its media_id. list_files lists the refs of the images you have.`,
                );
            }

            const saved = await setBotPicture({ user_id, bot_id: target, media });

            await pushBotUpdated({ bot_id: target });

            const whose = Number(target) == Number(bot_id) ? "Your" : "That bot's";

            return media
                ? `${whose} picture is saved. Tell the user it changed; they may need to reload to see it everywhere.`
                : `${whose} picture is removed, so it shows its stone again.`;
        },
    };
}
