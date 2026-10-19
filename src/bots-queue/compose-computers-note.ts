import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import computerRef from "@/src/utils/computer-ref";

type Params = {
    /**
     * The bot's computers, the current one first (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The coordinator can use every computer and give the crew access.
     */
    is_coordinator?: boolean;
};

/**
 * Added to a bot's chat prompt so it knows which computers it has, which
 * one it's on, and how it reaches them (markdown). Without it a bot asked
 * "can you see the computer?" says it can't.
 */
export default function composeComputersNote({ computers, is_coordinator }: Params) {
    if (!computers.length) {
        return `# Your computers\n\nYou have no computer, so you can't run commands, open files or browse. If the user asks for that, say so.`;
    }

    const listed = computers
        .map(
            (computer, index) =>
                `- ${computerRef({ id: computer.id || 0 })} ${computer.name || "Computer"}${
                    [index == 0 ? "you're on it" : "", computer.kind == "main" ? "main" : ""]
                        .filter(Boolean)
                        .map((tag) => ` (${tag})`)
                        .join("")
                }${computer.description ? `: ${computer.description}` : ""}`,
        )
        .join("\n");

    return `# Your computers

${listed}

Each is a Linux sandbox of your own (a shell, files, code runners and a browser), set up for the crew. It isn't the user's desktop: you can't see their screen or their own files unless they're put on it. The user picks which one you're on; your tasks run there.${
        is_coordinator
            ? ` As the coordinator you can use every computer the user has, and you decide which ones each crew member can use with assign_computer.`
            : ""
    }

- To find which computer holds something (a file, a running app, a logged-in session), use search_computers: it runs one read-only command on all of them at once.
- For anything else on a computer, start_task: the task runs on it with its tools and you post what you found here. Don't say you can't see a computer; search it or start a task.
- When you name a computer, write its ref exactly, e.g. ${computerRef({ id: computers[0]!.id || 0 })}. The user sees it as a button that switches you to that computer, so when they're looking for one, say which and that they can click it.`;
}
