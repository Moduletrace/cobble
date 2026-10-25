import type { BotPermission, BotType, TypeAssignmentMatrixType } from "../types";

/**
 * Every bot type. A bot with no `bot_types` row is a worker. A type holds
 * install-wide (`scope: "install"`, its row has no workspace) or in one
 * workspace (`scope: "workspace"`, its row names it). `bots.kind` stays the
 * legacy marker of the one coordinator for who sees it; what a bot can do
 * comes from these.
 */
export const BotTypes = [
    {
        value: "coordinator",
        title: "Coordinator",
        description: "Coordinates the whole crew: hands work to every bot, grows the crew, runs workspaces and extensions. One per install, the super admin's alone.",
        scope: "install",
    },
    {
        value: "admin",
        title: "Workspace admin",
        description: "Leads one workspace: hands tasks to the other bots there, sets their instructions there, runs the workspace's task list and keeps its context.",
        scope: "workspace",
    },
    {
        value: "worker",
        title: "Worker",
        description: "Does its own job. Every bot without another type.",
        scope: "install",
    },
] as const;

/**
 * What a bot type lets a bot do.
 */
export const BotPermissions = [
    {
        value: "delegate_task",
        title: "Hand tasks to other bots",
    },
    {
        value: "set_member_instructions",
        title: "Set other bots' workspace instructions",
    },
    {
        value: "manage_workspace_tasks",
        title: "Run the workspace's task list",
    },
    {
        value: "edit_workspace",
        title: "Edit the workspace's name, description and context",
    },
    {
        value: "manage_crew",
        title: "Create, edit and delete bots, their computers and workspaces",
    },
    {
        value: "manage_workspaces",
        title: "Create and delete workspaces",
    },
    {
        value: "manage_extensions",
        title: "Manage skills, MCP servers and tools",
    },
    {
        value: "set_bot_types",
        title: "Make bots workspace admins",
    },
    {
        value: "set_any_picture",
        title: "Set any bot's picture",
    },
    {
        value: "reach_all_tasks",
        title: "Reach every task on the install",
    },
] as const;

/**
 * What each bot type may do, where it holds (everywhere for an
 * install-wide type, in its workspace for a workspace one).
 */
export const BotTypePermissionMatrix: Record<BotType, BotPermission[]> = {
    coordinator: BotPermissions.map((bp) => bp.value),
    admin: [
        "delegate_task",
        "set_member_instructions",
        "manage_workspace_tasks",
        "edit_workspace",
    ],
    worker: [],
};

/**
 * Which bots a bot may act on (hand a task to, set instructions for), keyed
 * by the target's type. Same shape as `UserTypeAssignmentMatrix`: the
 * coordinator passes through. A workspace admin directs workers only, so
 * two admins never hand work back and forth.
 */
export const BotTypeTargetMatrix: TypeAssignmentMatrixType<BotType> = {
    coordinator: {},
    admin: {
        allowed_actors: [],
    },
    worker: {
        allowed_actors: ["admin"],
    },
};

/**
 * Who may grant a bot type: user types (`admin`; the super admin passes
 * through) and bot types (`coordinator`). The coordinator type is never
 * granted: `ensureCoordinatorBot` writes it.
 */
export const BotTypeAssignmentMatrix: TypeAssignmentMatrixType<BotType> = {
    coordinator: {},
    admin: {
        allowed_actors: ["admin", "coordinator"],
    },
    worker: {},
};

export const BotTypeDeletionMatrix: TypeAssignmentMatrixType<BotType> = {
    coordinator: {},
    admin: {
        allowed_actors: ["admin", "coordinator"],
    },
    worker: {},
};
