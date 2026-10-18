import { describe, expect, test } from "bun:test";
import type { UserType } from "@/src/types";
import userTypeAssignment from "./user-type-assignment";
import {
    ALL_USER_TYPES,
    makeMatrix,
    makeUserTypes,
} from "./user-type-assignment.test-fixtures";

const ASSIGNMENT_MATRIX = makeMatrix();
const DELETION_MATRIX = makeMatrix();

function assign(params: {
    actor: string[];
    target_type: string;
    target?: string[];
    action?: "assign" | "delete";
}) {
    return userTypeAssignment({
        actor_user_types: makeUserTypes(...params.actor),
        target_user_type: params.target_type as UserType,
        target_user_types: params.target as UserType[],
        action: params.action || "assign",
        assignment_matrix: ASSIGNMENT_MATRIX,
        deletion_matrix: DELETION_MATRIX,
    });
}

describe("userTypeAssignment", () => {
    test("pass-through (super_admin) can assign anything", () => {
        for (const target of ALL_USER_TYPES) {
            expect(
                assign({ actor: ["super_admin"], target_type: target }),
            ).toBe(true);
        }
    });

    test("pass-through (super_admin) can delete anything", () => {
        for (const target of ALL_USER_TYPES) {
            expect(
                assign({
                    actor: ["super_admin"],
                    target_type: target,
                    action: "delete",
                }),
            ).toBe(true);
        }
    });

    test("no actors allowed for super_admin", () => {
        expect(
            assign({ actor: ["admin"], target_type: "super_admin" }),
        ).toBe(false);
        expect(
            assign({
                actor: ["admin"],
                target_type: "super_admin",
                action: "delete",
            }),
        ).toBe(false);
    });

    test("empty allowed_actors means pass-through only", () => {
        for (const target of ["admin", "president", "vice_president", "secretary"]) {
            expect(assign({ actor: ["admin"], target_type: target })).toBe(
                false,
            );
        }
    });

    test("array allowed_actors matches any actor", () => {
        expect(assign({ actor: ["admin"], target_type: "board_member" })).toBe(
            true,
        );
        expect(assign({ actor: ["auditor"], target_type: "board_member" })).toBe(
            false,
        );
        expect(assign({ actor: ["admin"], target_type: "auditor" })).toBe(true);
    });

    test("per-actor rules respect excluded targets", () => {
        expect(
            assign({
                actor: ["admin"],
                target_type: "read_only",
                target: ["admin"],
            }),
        ).toBe(true);

        expect(
            assign({
                actor: ["admin"],
                target_type: "read_only",
                target: ["super_admin"],
            }),
        ).toBe(false);
    });

    test("per-actor rules respect allowed targets", () => {
        expect(
            assign({
                actor: ["admin"],
                target_type: "revoked",
                target: ["board_member"],
            }),
        ).toBe(true);

        expect(
            assign({
                actor: ["admin"],
                target_type: "revoked",
                target: ["admin"],
            }),
        ).toBe(false);
    });

    test("missing target user types fail allowed_targets checks", () => {
        expect(
            assign({
                actor: ["admin"],
                target_type: "revoked",
                target: [],
            }),
        ).toBe(false);
    });

    test("same_as clones rules of another actor", () => {
        const matrix = makeMatrix({
            read_only: {
                allowed_actors: {
                    admin: { excluded_targets: ["super_admin"] },
                    auditor: { same_as: "admin" },
                },
            },
        });

        expect(
            userTypeAssignment({
                actor_user_types: makeUserTypes("auditor"),
                target_user_type: "read_only",
                target_user_types: ["admin"] as UserType[],
                action: "assign",
                assignment_matrix: matrix,
                deletion_matrix: matrix,
            }),
        ).toBe(true);

        expect(
            userTypeAssignment({
                actor_user_types: makeUserTypes("auditor"),
                target_user_type: "read_only",
                target_user_types: ["super_admin"] as UserType[],
                action: "assign",
                assignment_matrix: matrix,
                deletion_matrix: matrix,
            }),
        ).toBe(false);
    });

    test("all flag grants unconditional access", () => {
        const matrix = makeMatrix({
            board_member: {
                allowed_actors: {
                    admin: { all: true },
                },
            },
        });

        expect(
            userTypeAssignment({
                actor_user_types: makeUserTypes("admin"),
                target_user_type: "board_member" as UserType,
                target_user_types: ["super_admin"] as UserType[],
                action: "assign",
                assignment_matrix: matrix,
                deletion_matrix: matrix,
            }),
        ).toBe(true);
    });
});
describe("unknown user types", () => {
    test("types missing from the matrix are denied instead of throwing", () => {
        expect(
            userTypeAssignment({
                actor_user_types: makeUserTypes("admin"),
                target_user_type: "not_in_matrix" as UserType,
                action: "assign",
                assignment_matrix: makeMatrix(),
                deletion_matrix: makeMatrix(),
            }),
        ).toBe(false);
    });
});
