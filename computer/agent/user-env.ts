import { AgentConfig } from "./config";

/**
 * The environment everything run as the computer's user gets: its own
 * home and identity, the virtual screen and the session bus, and nothing
 * of the agent's own (its token never reaches a command).
 */
export default function userEnv({ extra = {} }: { extra?: NodeJS.ProcessEnv } = {}): NodeJS.ProcessEnv {
    return {
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        HOME: AgentConfig.Home,
        USER: AgentConfig.User,
        LOGNAME: AgentConfig.User,
        SHELL: "/bin/bash",
        LANG: process.env.LANG || "C.UTF-8",
        TZ: process.env.TZ || "UTC",
        DISPLAY: AgentConfig.Display,
        XAUTHORITY: AgentConfig.XAuthority,
        XDG_RUNTIME_DIR: `${AgentConfig.RunDir}/xdg`,
        DBUS_SESSION_BUS_ADDRESS: `unix:path=${AgentConfig.RunDir}/bus`,
        PIP_BREAK_SYSTEM_PACKAGES: "1",
        ...extra,
    };
}
