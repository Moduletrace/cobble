import type {
    UserAssignmentFnParams,
    UserTypeAssignmentRules,
} from "@/src/types";
import {
    UserTypeAssignmentMatrix,
    UserTypeDeletionMatrix,
} from "@/src/dict/user-types-dict";
import isPassThroughUser from "./is-pass-through-user";

/**
 * Whether the actor may assign or remove `target_user_type` on a user.
 * Governed by `UserTypeAssignmentMatrix` and `UserTypeDeletionMatrix` and
 * applied symmetrically to granting and removing. Pass-through actors
 * (`super_admin`) can always assign.
 */
export default function userTypeAssignment({
    actor_user_types,
    target_user_type,
    target_user_types,
    action,
    assignment_matrix = UserTypeAssignmentMatrix,
    deletion_matrix = UserTypeDeletionMatrix,
    debug,
}: UserAssignmentFnParams): boolean {
    if (isPassThroughUser({ user_types: actor_user_types })) {
        if (debug) {
            console.log(
                `[RBAC] Pass-through actor detected for [${target_user_type}], access granted.`,
            );
        }
        return true;
    }

    const matrix = action == "assign" ? assignment_matrix : deletion_matrix;

    const assignable_by = matrix[target_user_type];

    if (!assignable_by?.allowed_actors) {
        if (debug) {
            console.log(
                `[RBAC] No allowed actors for [${target_user_type}] in the ${action} matrix.`,
            );
        }
        return false;
    }

    const is_target_user_type_excluded =
        target_user_types && assignable_by.excluded_targets
            ? target_user_types.find((tut) =>
                  assignable_by.excluded_targets?.find((ex) => ex == tut),
              )
            : false;

    if (is_target_user_type_excluded) {
        if (debug) {
            console.log(
                `[RBAC] Target user type [${target_user_types?.join(",")}] excluded for [${target_user_type}].`,
            );
        }
        return false;
    }

    const actor_type_set = new Set<string>(
        actor_user_types
            ?.map((ut) => ut.user_type)
            .filter((ut): ut is string => Boolean(ut)),
    );

    if (Array.isArray(assignable_by.allowed_actors)) {
        if (!assignable_by.allowed_actors.length) {
            if (debug) {
                console.log(
                    `[RBAC] Actor not allowed for [${target_user_type}], allowed actors list is empty.`,
                );
            }
            return false;
        }

        return assignable_by.allowed_actors.some((actor_type) =>
            actor_type_set.has(actor_type),
        );
    }

    const allowed_actors_matrix = assignable_by.allowed_actors as Record<
        string,
        UserTypeAssignmentRules | undefined
    >;

    if (!Object.keys(allowed_actors_matrix).length) {
        if (debug) {
            console.log(
                `[RBAC] No allowed actors matrix for [${target_user_type}].`,
            );
        }
        return false;
    }

    return Array.from(actor_type_set).some((actor_type) => {
        let actor_rules = allowed_actors_matrix[actor_type];

        if (
            actor_rules?.same_as &&
            allowed_actors_matrix[actor_rules.same_as]
        ) {
            actor_rules = {
                ...actor_rules,
                ...allowed_actors_matrix[actor_rules.same_as],
            };
        }

        if (actor_rules?.all) {
            if (debug) {
                console.log(
                    `[RBAC] Actor [${actor_type}] has all access for [${target_user_type}].`,
                );
            }
            return true;
        }

        if (!actor_rules?.allowed_targets && !actor_rules?.excluded_targets) {
            if (debug) {
                console.log(
                    `[RBAC] No actor rules for [${actor_type}] on [${target_user_type}].`,
                );
            }
            return false;
        }

        if (
            actor_rules.allowed_targets &&
            !actor_rules.allowed_targets.find((t) =>
                target_user_types?.includes(t),
            )
        ) {
            if (debug) {
                console.log(
                    `[RBAC] Target user types [${target_user_types?.join(",")}] not included for [${actor_type}] -> [${target_user_type}].`,
                );
            }
            return false;
        }

        if (
            actor_rules.excluded_targets &&
            actor_rules.excluded_targets.find((t) =>
                target_user_types?.includes(t),
            )
        ) {
            if (debug) {
                console.log(
                    `[RBAC] Target user types [${target_user_types?.join(",")}] excluded for [${actor_type}] -> [${target_user_type}].`,
                );
            }
            return false;
        }

        if (debug) {
            console.log(
                `[RBAC] Actor [${actor_type}] granted [${action}] of [${target_user_type}].`,
            );
        }
        return true;
    });
}