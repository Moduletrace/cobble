/**
 * How long a `computer_bash` call may run: the bot's own `timeout` when it
 * names one, else the install's limit (`AppData.ComputerCommandMaxSeconds`,
 * 0 for none). `null` means the command runs until it ends, the run is
 * stopped or its job ends.
 */
export default function commandTimeoutSeconds({ asked, max }: { asked?: number; max: number }): number | null {
    const asked_seconds = asked ? Math.max(1, Math.ceil(asked)) : null;

    if (max <= 0) return asked_seconds;

    return asked_seconds == null ? max : Math.min(max, asked_seconds);
}