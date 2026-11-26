import { ComposerCommands, type ComposerCommand } from "../(data)/composer-commands";

/**
 * The slash commands the composer's text is asking for, from the list the
 * caller says this user gets: all of them while it is just `/`, then those
 * the letters typed so far begin. Anything else (`/etc/hosts`, a command
 * followed by more words) is an ordinary message and matches none.
 */
export default function composerCommandMatches({
    text,
    commands = ComposerCommands,
}: {
    text: string;
    commands?: ComposerCommand[];
}): ComposerCommand[] {
    const match = /^\/([a-z]*)$/i.exec(text.trim());

    if (!match) return [];

    const typed = (match[1] ?? "").toLowerCase();

    return commands.filter((command) => command.name.startsWith(typed));
}
