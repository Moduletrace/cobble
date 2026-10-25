import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import { ExtensionTables, type ExtensionKind } from "@/src/functions/backend/db/extensions/extension-tables";
import grabExtensionAccess from "@/src/functions/backend/db/extensions/grab-extension-access";
import setExtensionAccess from "@/src/functions/backend/db/extensions/set-extension-access";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import describeExtensionAccess from "./describe-extension-access";
import { ExtensionKindSchema } from "./extension-kind-schema";

type Params = {
    user_id: number | string;
};

type Args = {
    kind: ExtensionKind;
    id: number;
    bot_ids?: number[];
    workspace_ids?: number[];
    all_bots?: boolean;
};

/**
 * Lets the coordinator decide which bots and workspaces get a skill, MCP
 * server or custom tool, as the settings pages' Access modal does
 * (`setExtensionAccess`), then reads the result back.
 */
export default function setExtensionAccessTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "set_extension_access",
        description: `Set which bots and workspaces get a skill, MCP server or custom tool (by kind and id). bot_ids and workspace_ids are the complete lists it ends up with: read the current ones with list_extensions and add to or take from them; a list you leave out stays as it is. A workspace's gives it to every bot working there. all_bots true also gives it to every bot now and to every new bot; false only stops new bots getting it.`,
        schema: z.object({
            kind: ExtensionKindSchema,
            id: z.number().int().positive(),
            bot_ids: z.array(z.number().int().positive()).max(1000).optional(),
            workspace_ids: z.array(z.number().int().positive()).max(1000).optional(),
            all_bots: z.boolean().optional(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const current = (await grabExtensionAccess({ kind: args.kind }))(args.id);

            await setExtensionAccess({
                user_id,
                kind: args.kind,
                id: args.id,
                bot_ids: args.bot_ids ?? current.bot_ids,
                workspace_ids: args.workspace_ids ?? current.workspace_ids,
                all_bots: args.all_bots,
            });

            const saved = (await grabExtensionAccess({ kind: args.kind }))(args.id);
            const { label, table } = ExtensionTables[args.kind];
            const all_bots =
                (
                    await BunSQLite.sql<{ all_bots: number }>({
                        sql: `SELECT all_bots FROM ${table} WHERE id = ?`,
                        values: [args.id],
                    })
                ).payload?.[0]?.all_bots == 1;

            await logEvent({
                title: `${label.charAt(0).toUpperCase()}${label.slice(1)} access changed`,
                category: "system",
                user_id: Number(user_id),
                plain_text: `The coordinator changed who gets the ${label} #${args.id}.`,
                metadata: { kind: args.kind, id: args.id, ...saved },
            });

            /**
             * A bot or workspace id that doesn't exist is skipped by
             * `setExtensionAccess`, so say which never landed.
             */
            const missing = [
                ...(args.bot_ids || []).filter((id) => !saved.bot_ids.includes(id)).map((id) => `bot ${id}`),
                ...(args.workspace_ids || [])
                    .filter((id) => !saved.workspace_ids.includes(id))
                    .map((id) => `workspace ${id}`),
            ];

            return `Saved the ${label} #${args.id}. Who gets it now: ${describeExtensionAccess({ all_bots, ...saved })}.${missing.length ? ` These don't exist, so they weren't given it: ${missing.join(", ")}.` : ""}`;
        },
    };
}
