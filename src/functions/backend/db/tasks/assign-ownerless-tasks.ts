import passOnBotTasks from "./pass-on-bot-tasks";

/**
 * At boot: every task belongs to a bot. Workspace tasks left without one
 * by earlier versions ("shared") go to the workspace's admin bot, else the
 * coordinator.
 */
export default async function assignOwnerlessTasks() {
    return await passOnBotTasks({});
}
