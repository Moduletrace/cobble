/**
 * One line on the agent's output (the container's log).
 */
export default function log({ name, message }: { name: string; message: string }) {
    process.stdout.write(`[${new Date().toISOString()}] [${name}] ${message}\n`);
}
