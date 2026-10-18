import type { UserType, UserTypeAssignmentMatrixType } from "../types";

export const UserTypes = [
    {
        value: "super_admin",
    },
    {
        value: "admin",
    },
    {
        value: "auditor",
    },
    {
        value: "president",
    },
    {
        value: "vice_president",
    },
    {
        value: "secretary",
    },
    {
        value: "revoked",
    },
    {
        value: "read_only",
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
    president: {
        allowed_actors: [],
    },
    vice_president: {
        allowed_actors: [],
    },
    secretary: {
        allowed_actors: [],
    },
    auditor: {
        allowed_actors: ["admin"],
    },
    read_only: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin"],
            },
        },
    },
    revoked: {
        allowed_actors: {
            admin: {
                allowed_targets: ["read_only"],
                excluded_targets: [
                    "super_admin",
                    "admin",
                    "president",
                    "vice_president",
                    "secretary",
                ],
            },
        },
    },
};

export const UserTypeDeletionMatrix: UserTypeAssignmentMatrixType = {
    super_admin: {},
    admin: {
        allowed_actors: [],
    },
    president: {
        allowed_actors: [],
    },
    vice_president: {
        allowed_actors: [],
    },
    secretary: {
        allowed_actors: [],
    },
    auditor: {
        allowed_actors: ["admin"],
    },
    read_only: {
        allowed_actors: {
            admin: {
                excluded_targets: ["super_admin"],
            },
        },
    },
    revoked: {
        allowed_actors: {
            admin: {
                allowed_targets: ["read_only"],
                excluded_targets: [
                    "super_admin",
                    "admin",
                    "president",
                    "vice_president",
                    "secretary",
                ],
            },
        },
    },
};
