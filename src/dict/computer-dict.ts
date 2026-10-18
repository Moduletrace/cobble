/**
 * A computer is an AIO sandbox running in its own docker container on the
 * cobble network. The main computer is set up at install and recorded on
 * signup; sandboxes are created later by the main container.
 */
export const ComputerKinds = [
    {
        title: "Main",
        value: "main",
    },
    {
        title: "Sandbox",
        value: "sandbox",
    },
] as const;

export type ComputerKind = (typeof ComputerKinds)[number]["value"];

export const MainComputerName = "Main computer";

/**
 * Docker container state as reported by `docker inspect` (`State.Status`),
 * plus `unknown` for a record that hasn't been inspected yet.
 */
export const ContainerStatuses = [
    {
        title: "Created",
        value: "created",
    },
    {
        title: "Running",
        value: "running",
    },
    {
        title: "Paused",
        value: "paused",
    },
    {
        title: "Restarting",
        value: "restarting",
    },
    {
        title: "Exited",
        value: "exited",
    },
    {
        title: "Removing",
        value: "removing",
    },
    {
        title: "Dead",
        value: "dead",
    },
    {
        title: "Unknown",
        value: "unknown",
    },
] as const;

export type ContainerStatus = (typeof ContainerStatuses)[number]["value"];

/**
 * What a recorded container is for. The main app container is never recorded.
 */
export const ContainerPurposes = [
    {
        title: "Computer",
        value: "computer",
    },
] as const;

export type ContainerPurpose = (typeof ContainerPurposes)[number]["value"];
