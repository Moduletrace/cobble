import type {
    UserType,
    UserTypeAssignmentMatrixType,
} from "@/src/types";

/**
 * Synthetic types (`orphan`, `board_member`) exercise the matrix interpreter
 * independently of the preset's real `UserTypes`.
 */
export const ALL_USER_TYPES = [
    "super_admin",
    "admin",
    "auditor",
    "president",
    "vice_president",
    "secretary",
    "orphan",
    "revoked",
    "read_only",
    "board_member",
] as UserType[];

/**
 * Matrix keyed by any type name, cast to the real matrix type for the
 * interpreter.
 */
type FixtureMatrix = Record<string, any>;

type UserTypesInput = string[];

export function makeUserTypes(...types: UserTypesInput): { user_type: string }[] {
    return types.map((user_type) => ({ user_type }));
}

export function makeMatrix(
    overrides?: FixtureMatrix,
): UserTypeAssignmentMatrixType {
    const base: FixtureMatrix = {
        super_admin: {},
        admin: { allowed_actors: [] },
        president: { allowed_actors: [] },
        vice_president: { allowed_actors: [] },
        secretary: { allowed_actors: [] },
        board_member: { allowed_actors: ["admin"] },
        auditor: { allowed_actors: ["admin"] },
        orphan: { allowed_actors: ["admin"] },
        read_only: {
            allowed_actors: {
                admin: { excluded_targets: ["super_admin"] },
            },
        },
        revoked: {
            allowed_actors: {
                admin: {
                    allowed_targets: ["board_member", "auditor", "orphan"],
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

    return {
        ...base,
        ...overrides,
    } as UserTypeAssignmentMatrixType;
}