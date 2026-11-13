import { z } from "zod";
import { CitableGeneralSettingsSections } from "@/src/dict/general-settings-dict";
import grabGeneralSettingsValues from "@/src/functions/backend/db/app-settings/grab-general-settings-values";
import describeGeneralSettings from "@/src/utils/describe-general-settings";
import type { HarnessTool } from "../../../types";

type Args = {
    section?: string;
};

/**
 * The General settings a run's limits come from, read live, with the ref
 * that points a reader at each one. A bot that hit a limit (steps used up,
 * a folder full, a message too long) and one answering "why did that cost
 * so much" both need to name the same page and value.
 */
export default function readSettingsTool(): HarnessTool<Args> {
    return {
        name: "read_settings",
        description: `Read Settings > General as it is now: the app's run limits (steps per task, per chat reply and per routine or hook call, tokens per run, working context), session length, message length, skill limits, retention days and storage quotas, each with who may change it and the ref to write.

Use it when a limit stopped you or shaped your answer, and when the user asks why something is capped, why a reply was cut short or why a message was refused: say the setting, its value as the form shows it and who can change it, then write its ref exactly as given (e.g. [setting:run-limits:reply_steps]) - the chat shows that as a pill that opens the page and the field.

You never change these settings yourself, and never say one was changed.`,
        schema: z.object({
            section: z
                .string()
                .optional()
                .describe("One section's key, to read only that (e.g. run-limits, storage). Leave it out for all of them."),
        }),
        run: async ({ args }) => {
            const everything = await grabGeneralSettingsValues();
            const citable = everything.filter((section) =>
                CitableGeneralSettingsSections.some((known) => known.key == section.key),
            );

            if (!args.section) return describeGeneralSettings({ sections: citable });

            const one = citable.find((section) => section.key == args.section);

            if (!one) {
                return `There is no citable setting section "${args.section}". The ones you can name: ${citable.map((section) => section.key).join(", ")}.`;
            }

            return describeGeneralSettings({ sections: [one] });
        },
    };
}