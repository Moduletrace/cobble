/**
 * Tools a run ends on: they put a card under the answer and expect nothing
 * after them. `ask_user` waits for the user's answer, and
 * `suggest_next_steps` is offered when the work is done, so a turn that
 * writes the reply and asks, or offers what comes next, has said everything
 * it has to say.
 *
 * `runTextLoop` reads this to end the run on that turn, because the reply is
 * only the run's last message. A run that went on after answering sent
 * whatever it wrote last instead: a bot wrote out the PR links the user
 * asked for, then called `list_tasks` (which `TaskReminderNote` told it to
 * do after answering), and the user got the short "still open" line with no
 * links in it (Nov 2026).
 */
export const ClosingToolNames: readonly string[] = ["ask_user", "suggest_next_steps"];

/**
 * Whether a call to this tool ends the run when it carries the answer.
 */
export default function isClosingTool({ name }: { name: string }) {
    return ClosingToolNames.includes(name);
}