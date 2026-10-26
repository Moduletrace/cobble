import type {
    BotPermission,
    BotRole,
    BotType,
    TypeAssignmentMatrixType,
} from "../types";

/**
 * Types a bot holds on top of its kind (`bots.kind`: coordinator or
 * worker), like `user_types` for users. A bot with none is just its kind.
 * Each `bot_types` row names the workspace the type holds in.
 */
export const BotTypes = [
    {
        value: "workspace_admin",
        title: "Workspace admin",
        description:
            "Leads one workspace: hands tasks to the other bots there, sets their instructions there, runs the workspace's task list and keeps its context.",
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
 * What each role (a kind, or a type held where the bot works) may do.
 */
export const BotTypePermissionMatrix: Record<BotRole, BotPermission[]> = {
    coordinator: BotPermissions.map((bp) => bp.value),
    workspace_admin: [
        "delegate_task",
        "set_member_instructions",
        "manage_workspace_tasks",
        "edit_workspace",
    ],
    worker: [],
};

/**
 * Which bots a bot may act on (hand a task to, set instructions for), keyed
 * by the target's role. Same shape as `UserTypeAssignmentMatrix`: the
 * coordinator passes through. A workspace admin directs workers only, so
 * two admins never hand work back and forth.
 */
export const BotTypeTargetMatrix: TypeAssignmentMatrixType<BotRole> = {
    coordinator: {},
    workspace_admin: {
        allowed_actors: [],
    },
    worker: {
        allowed_actors: ["workspace_admin"],
    },
};

/**
 * Who may grant a bot type: user types (`admin`; the super admin passes
 * through) and bot kinds (`coordinator`).
 */
export const BotTypeAssignmentMatrix: TypeAssignmentMatrixType<BotType> = {
    workspace_admin: {
        allowed_actors: ["admin", "coordinator"],
    },
};

export const BotTypeDeletionMatrix: TypeAssignmentMatrixType<BotType> = {
    workspace_admin: {
        allowed_actors: ["admin", "coordinator"],
    },
};
