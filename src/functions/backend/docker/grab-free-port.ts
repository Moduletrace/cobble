/**
 * A port nothing on this host listens on right now, for publishing a
 * computer when the app runs outside docker and can't reach it by name.
 */
export default function grabFreePort() {
    const listener = Bun.listen({
        hostname: "127.0.0.1",
        port: 0,
        socket: { data() {} },
    });
    const port = listener.port;

    listener.stop(true);

    return port;
}
