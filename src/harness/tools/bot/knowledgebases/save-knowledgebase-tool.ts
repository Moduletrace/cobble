import { z } from "zod";
import grabExtensionAccess from "@/src/functions/backend/db/extensions/grab-extension-access";
import setExtensionAccess from "@/src/functions/backend/db/extensions/set-extension-access";
import grabKnowledgebase from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import saveKnowledgebase from "@/src/functions/backend/db/knowledgebases/save-knowledgebase";
import logEvent from "@/src/functions/backend/logger";
import AppError from "@/src/utils/app-error";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";
import describeKnowledgebase from "./describe-knowledgebase";

type Params = {
    user_id: number | string;
};

type Args = {
    knowledgebase_id?: number;
    name?: string;
    description?: string;
    enabled?: boolean;
    all_bots?: boolean;
    bot_ids?: number[];
    workspace_ids?: number[];
};

/**
 * Adds a knowledgebase, or changes one's name, description and whether it's
 * on, and who reaches it (the same links the settings page's Access modal
 * writes). Only the super admin, and only when they asked for it: the
 * other tools fill and read a knowledgebase, this one makes it.
 */
export default function saveKnowledgebaseTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "save_knowledgebase",
        description: `Add a knowledgebase, or change an existing one (knowledgebase_id). name, description and enabled say what it is; bot_ids and workspace_ids are the complete lists of who gets it (read them with list_knowledgebases first and add to or take from them), and all_bots gives it to every bot now and every new one. Leave out what shouldn't change. A new knowledgebase has no documents: add them with add_knowledgebase_document. Only add or rename one on the super admin's own request.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive().optional(),
            name: z.string().trim().min(1).max(80).optional(),
            description: z.string().trim().max(1000).optional(),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
            bot_ids: z.array(z.number().int().positive()).max(1000).optional(),
            workspace_ids: z.array(z.number().int().positive()).max(1000).optional(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const current = args.knowledgebase_id
                ? await grabKnowledgebase({ knowledgebase_id: args.knowledgebase_id }).catch(() => null)
                : null;

            if (args.knowledgebase_id && !current) throw new AppError(`That knowledgebase doesn't exist.`);

            const name = args.name ?? current?.name ?? "";

            if (!name) throw new AppError(`Give the knowledgebase a name.`);

            const knowledgebase_id = await saveKnowledgebase({
                user_id,
                data: {
                    knowledgebase_id: args.knowledgebase_id,
                    name,
                    description: args.description ?? current?.description ?? "",
                    enabled: args.enabled ?? current?.enabled ?? true,
                    all_bots: args.all_bots ?? current?.all_bots ?? false,
                },
            });

            const share = await grabExtensionAccess({ kind: "knowledgebase" });
            const access = share(knowledgebase_id);
            const wantsAccess =
                args.bot_ids !== undefined || args.workspace_ids !== undefined || args.all_bots !== undefined;

            if (wantsAccess) {
                await setExtensionAccess({
                    user_id,
                    kind: "knowledgebase",
                    id: knowledgebase_id,
                    bot_ids: args.bot_ids ?? access.bot_ids,
                    workspace_ids: args.workspace_ids ?? access.workspace_ids,
                    all_bots: args.all_bots,
                });
            }

            await logEvent({
                title: "Knowledgebase added",
                category: "system",
                user_id: Number(user_id),
                plain_text: `${current ? "Changed knowledgebase" : "Added knowledgebase"} #${knowledgebase_id} (${name}).`,
                metadata: { knowledgebase_id },
            });

            const saved = await grabKnowledgebasesOverview({ user_id });
            const knowledgebase = saved.knowledgebases.find((item) => item.id == Number(knowledgebase_id));

            return knowledgebase
                ? `Saved. ${describeKnowledgebase({ knowledgebase })}`
                : `Saved knowledgebase #${knowledgebase_id}.`;
        },
    };
}