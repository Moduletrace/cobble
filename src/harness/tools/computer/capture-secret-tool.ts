import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import saveUserSecret from "@/src/functions/backend/db/envs/save-user-secret";
import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import secretRef from "@/src/utils/secret-ref";
import type { HarnessTool } from "../../types";
import computerDirsShell from "./computer-dirs-shell";
import downloadComputerFile from "./download-computer-file";
import runComputerCommand from "./run-computer-command";

type Params = {
    /**
     * The sandbox's REST address (no `/mcp`).
     */
    base_url: string;
    /**
     * The computer's env file, sourced before a command.
     */
    shell_path: string;
    dirs: ComputerRunDirs;
    /**
     * Whose secret it becomes: the run's user, for this bot.
     */
    user_id: number | string;
    bot_id: number | string;
    /**
     * Called with each captured value and its key, so the run blanks it
     * out of everything the bot reads from then on.
     */
    onCapture: (params: { key: string; value: string; ref: string }) => void;
};

type Args = {
    key: string;
    description: string;
    from: "file" | "command";
    path?: string;
    command?: string;
};

/**
 * Saves a secret that's on the computer (a generated password, a token a
 * CLI printed, a key file) as the user's personal secret for this bot,
 * without the bot ever reading it: the file comes over the sandbox's
 * download endpoint, a command's output over its REST shell, and neither
 * is returned. The bot gets a `[secret:ID]` ref to show the user, and the
 * value is redacted from everything it reads afterwards.
 */
export default function captureSecretTool({
    base_url,
    shell_path,
    dirs,
    user_id,
    bot_id,
    onCapture,
}: Params): HarnessTool<Args> {
    return {
        name: "capture_secret",
        description: `Save a secret that's on this computer (a password you generated, a token or API key a command printed, a key file) as the user's own secret for you, without reading it yourself: never cat, echo or print a secret, capture it instead. from "file" saves a file's contents (path in your folders); from "command" saves what a bash command prints (stdout, with your envs set), e.g. "printenv NAME" or "openssl rand -base64 24 | tee pw.txt". One trailing newline is dropped. You get back a [secret:ID] ref: put it in your message and the user sees the secret masked, with Reveal and Copy. It's also set as $KEY on your computers for this user's later runs. Values over ${AppData.CapturedSecretMaxChars} characters are refused.`,
        schema: z.object({
            key: z.string().trim().min(1).max(128).describe("The env key it's saved under, e.g. ADMIN_PASSWORD"),
            description: z.string().trim().min(1).max(500).describe("What it is, for the user"),
            from: z.enum(["file", "command"]),
            path: z.string().trim().min(1).max(1000).optional().describe("For from file"),
            command: z.string().trim().min(1).max(4000).optional().describe("For from command"),
        }),
        run: async ({ args, signal }) => {
            const value = await readValue({ args, base_url, shell_path, dirs, signal });

            if (value.text === undefined) return value.error;

            const env_id = await saveUserSecret({
                user_id,
                bot_id,
                key: args.key,
                value: value.text,
                description: args.description,
            });
            const ref = secretRef({ id: env_id });

            onCapture({ key: args.key.trim(), value: value.text, ref });

            return `Saved as ${args.key.trim()} (${value.text.length} characters). Put ${ref} in your message to show it to the user; never repeat or guess the value.`;
        },
    };
}

async function readValue({
    args,
    base_url,
    shell_path,
    dirs,
    signal,
}: {
    args: Args;
    base_url: string;
    shell_path: string;
    dirs: ComputerRunDirs;
    signal?: AbortSignal;
}): Promise<{ text: string; error?: undefined } | { text?: undefined; error: string }> {
    let text = "";

    if (args.from == "file") {
        if (!args.path) return { error: `Give the file's path.` };

        const download = await downloadComputerFile({
            base_url,
            path: resolveComputerPath({ path: args.path, dirs }),
            max_bytes: AppData.CapturedSecretMaxChars * 4,
            signal,
        });

        if (!download.ok) {
            return {
                error:
                    download.reason == "missing"
                        ? `There's no file at ${args.path}.`
                        : download.reason == "too_big"
                          ? `That file is too big to be a secret.`
                          : `The file changed while it was read. Try again.`,
            };
        }

        text = download.bytes.toString("utf8");
    } else {
        if (!args.command) return { error: `Give the command.` };

        const result = await runComputerCommand({
            base_url,
            command: `(${computerDirsShell({ dirs })}[ -f ${shell_path} ] && . ${shell_path}; ${args.command}) 2>/dev/null`,
            timeout_ms: AppData.CaptureSecretTimeoutMs,
            signal,
        });

        if (result.exit_code != 0) {
            return { error: `The command failed (exit code ${result.exit_code ?? "unknown"}). Nothing was saved.` };
        }

        text = result.output;
    }

    text = text.replace(/\r?\n$/, "");

    if (!text) return { error: `It was empty. Nothing was saved.` };

    if (text.length > AppData.CapturedSecretMaxChars) {
        return { error: `That's over ${AppData.CapturedSecretMaxChars} characters, too long to be a secret. Nothing was saved.` };
    }

    return { text };
}
