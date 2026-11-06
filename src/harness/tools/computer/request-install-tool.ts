import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { InstallPackageManagers, InstallPackageNamePattern, type InstallPackageManager } from "@/src/dict/install-request-dict";
import createInstallRequest from "@/src/functions/backend/db/install-requests/create-install-request";
import installRequestAsked from "@/src/utils/install-request-asked";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The session the task runs in: the answer comes back there.
     */
    session_id: number | string;
    workspace_id?: number | string | null;
    computer_id: number | string;
};

type Args = {
    packages: { manager: InstallPackageManager; name: string }[];
    reason: string;
    notes?: string;
};

/**
 * A worker's way to get something installed on its computer: it works
 * there as its own account, without sudo, so it asks the coordinator
 * (`createInstallRequest`), which weighs the request and installs or
 * refuses. Tasks run one at a time per computer, so the coordinator's
 * can start only once this run ends: the bot is told to finish now and
 * is woken with the answer.
 */
export default function requestInstallTool({ user_id, bot_id, session_id, workspace_id, computer_id }: Params): HarnessTool<Args> {
    return {
        name: "request_install",
        description: `Ask the coordinator to install something on this computer that needs root: you have no sudo here. Name each package exactly (apt for Debian's packages, or pip/npm for one that must be installed for the whole system) and say why the work needs it. Install Python and Node packages yourself first (pip install --user, npm install -g: they go to ~/.local in your folder), and look for a way that needs no install. The coordinator decides, and it never adds package sources, runs install scripts from the web or changes the computer's accounts. Its task can only start once your run ends, so after asking, finish your run straight away, saying what you're waiting for; you're woken with its answer.`,
        schema: z.object({
            packages: z
                .array(
                    z.object({
                        manager: z.enum(InstallPackageManagers),
                        name: z
                            .string()
                            .trim()
                            .min(1)
                            .max(100)
                            .regex(InstallPackageNamePattern, "A package name only: letters, digits and + . _ - (npm's @scope/name too), no versions, URLs, paths or flags"),
                    }),
                )
                .min(1)
                .max(AppData.InstallRequestMaxPackages),
            reason: z.string().trim().min(1).max(AppData.InstallRequestReasonMaxChars).describe("What the work needs it for"),
            notes: z
                .string()
                .trim()
                .max(AppData.InstallRequestReasonMaxChars)
                .optional()
                .describe("Anything else the coordinator should know, e.g. a version the work needs"),
        }),
        run: async ({ args }) => {
            const { request_id } = await createInstallRequest({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                computer_id,
                packages: args.packages,
                reason: args.reason,
                notes: args.notes,
            });

            return `Asked the coordinator (install request #${request_id}: ${installRequestAsked({ packages: args.packages })}). It can only install once your run ends (one task at a time on this computer), so finish now: say in your report what you're waiting for and what you'll do once it's there. You'll be woken with its answer.`;
        },
    };
}
