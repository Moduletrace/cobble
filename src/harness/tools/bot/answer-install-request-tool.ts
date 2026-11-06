import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import answerInstallRequest from "@/src/functions/backend/db/install-requests/answer-install-request";
import type { HarnessTool } from "../../types";

type Params = {
    request_id: number;
    /**
     * The coordinator's job the request was given to.
     */
    job_id: number;
};

type Args = {
    outcome: "installed" | "refused";
    note: string;
};

/**
 * The coordinator's answer to the install request its task weighs. The
 * worker that asked hears it when the run ends (`settleInstallRequest`).
 */
export default function answerInstallRequestTool({ request_id, job_id }: Params): HarnessTool<Args> {
    return {
        name: "answer_install_request",
        description: `Answer install request #${request_id}, once, after you've decided: "installed" once you've installed what you accept and checked it's there, or "refused" with why. The note goes to the bot that asked: what's installed (versions, where), what you left out and why, or what it could do instead. The bot hears it when your run ends.`,
        schema: z.object({
            outcome: z.enum(["installed", "refused"]),
            note: z.string().trim().min(1).max(AppData.InstallRequestAnswerMaxChars),
        }),
        run: async ({ args }) => {
            const answered = await answerInstallRequest({ request_id, job_id, outcome: args.outcome, note: args.note });

            if (!answered) return `Install request #${request_id} is already answered; the bot that asked hears it when your run ends.`;

            return `Answered install request #${request_id} (${args.outcome}). The bot that asked hears it when your run ends: finish with a short report for the user here.`;
        },
    };
}
