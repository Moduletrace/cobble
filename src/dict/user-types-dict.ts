import type { UserType, UserTypeAssignmentMatrixType } from "../types";

/**
 * Every user type on this install. A user needs at least one to sign in.
 */
export const UserTypes = [
    {
        value: "super_admin",
        title: "Super admin",
        description: "Runs the install: models, environment, computers and users. The first account.",
    },
    {
        value: "admin",
        title: "Admin",
        description: "Adds and manages members.",
    },
    {
        value: "member",
        title: "Member",
        description: "Has their own crew, workspaces and main computer.",
    },
    {
        value: "read_only",
        title: "Read only",
        description: "Can look around, but can't change anything.",
    },
    {
        value: "revoked",
        title: "Revoked",
        description: "Can't sign in. Their crew and files are kept.",
    },
] as const;

export const SuperAdminOnlyEditableUserTypes: UserType[] = ["revoked"];

export const UneditableUserTypes: UserType[] = ["super_admin"];

export const RolesAdminCantUpdate: UserType[] = [
    "super_admin",
    "admin",
    "revoked",
];

export const UserManagementUserTypes: UserType[] = ["admin"];

/**
 * Declarative ACL for granting user types.
 *
 * Matrix forms:
 * - `allowed_actors` as an array lists actor types allowed to perform the action.
 * - `allowed_actors` as a per-actor matrix keys actors to rules:
 *   - `allowed_targets`: the target user must hold at least one of these types.
 *   - `excluded_targets`: the target user must not hold any of these types.
 * - Entry-level `excluded_targets` blocks the action when the target user
 *   holds any listed type.
 * - Empty/missing `allowed_actors` means only pass-through actors
 *   (`super_admin`) may perform the action.
 * - `same_as` clones the rules of another actor type.
 */
export const UserTypeAssignmentMatrix: UserTypeAssignmentMatrixType = {
    super_admin: {},
    admin: {
        allowed_actors: [],
    },
    member: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
    read_only: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
    revoked: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
};

export const UserTypeDeletionMatrix: UserTypeAssignmentMatrixType = {
    super_admin: {},
    admin: {
        allowed_actors: [],
    },
    member: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
    read_only: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
    revoked: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin", "admin"],
            },
        },
    },
};
