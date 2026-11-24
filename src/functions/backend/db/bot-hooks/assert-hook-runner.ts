import AppError from "@/src/utils/app-error";
import assertCrewManager from "../access/assert-crew-manager";
import grabBotComputers from "../computers/grab-bot-computers";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    runner_computer_id?: number | string | null;
};

/**
 * Checks who may give a hook a runner and where it runs: only a crew
 * manager, since the command is a process the app starts again and again
 * as that bot's account; and only on a Docker computer the bot reaches,
 * since an SSH server runs nothing for the app. Returns the computer id
 * to store (the bot's own when none was picked), so the row always says
 * where its runner belongs.
 */
export default async function assertHookRunner({ user_id, bot_id, workspace_id, runner_computer_id }: Params) {
    await assertCrewManager({ user_id });

    const computers = await grabBotComputers({ bot_id, workspace_id });

    const picked = runner_computer_id
        ? computers.find((computer) => Number(computer.id) == Number(runner_computer_id))
        : computers[0];

    if (runner_computer_id && !picked) {
        throw new AppError(`That computer isn't one this bot works on.`);
    }

    if (!picked?.id) throw new AppError(`This bot has no computer to run the runner on.`);

    if (picked.connection == "ssh") {
        throw new AppError(
            `A runner needs a Docker computer: ${picked.name} is reached over SSH, where the app starts nothing.`,
        );
    }

    return Number(picked.id);
}