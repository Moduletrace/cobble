import type { TypeAssignmentMatrixType, TypeAssignmentRules } from "@/src/types";

type Params = {
    /**
     * The actor's types: user types, bot types, or both.
     */
    actor_types: string[];
    /**
     * Whether the actor bypasses the matrix (the super admin).
     */
    pass_through?: boolean;
    target_type: string;
    /**
     * The types the target already holds.
     */
    target_types?: string[];
    action: "assign" | "delete";
    assignment_matrix: TypeAssignmentMatrixType<string>;
    deletion_matrix: TypeAssignmentMatrixType<string>;
    /**
     * Prefix for debug lines.
     */
    label?: string;
    debug?: boolean;
};

/**
 * The type-matrix interpreter, for any set of types (user types through
 * `userTypeAssignment`, bot types through `botTypeAssignment` and
 * `botCanTarget`). Whether an actor holding `actor_types` may assign or
 * remove `target_type` on a target holding `target_types`.
 *
 * Matrix forms:
 * - `allowed_actors` as an array lists actor types allowed to act.
 * - `allowed_actors` as a per-actor matrix keys actors to rules:
 *   - `allowed_targets`: the target must hold at least one of these types.
 *   - `excluded_targets`: the target must not hold any of these types.
 *   - `all`: anything goes for that actor.
 *   - `same_as`: clones the rules of another actor type.
 * - Entry-level `excluded_targets` blocks the action when the target holds
 *   any listed type.
 * - Empty/missing `allowed_actors` means only pass-through actors may act.
 */
export default function typeAssignment({
    actor_types,
    pass_through,
    target_type,
    target_types,
    action,
    assignment_matrix,
    deletion_matrix,
    label = "RBAC",
    debug,
}: Params): boolean {
    const log = (text: string) => {
        if (debug) console.log(`[${label}] ${text}`);
    };

    if (pass_through) {
        log(`Pass-through actor detected for [${target_type}], access granted.`);
        return true;
    }

    const matrix = action == "assign" ? assignment_matrix : deletion_matrix;

    const assignable_by = matrix[target_type];

    if (!assignable_by?.allowed_actors) {
        log(`No allowed actors for [${target_type}] in the ${action} matrix.`);
        return false;
    }

    const is_target_type_excluded =
        target_types && assignable_by.excluded_targets
            ? target_types.find((tt) =>
                  assignable_by.excluded_targets?.find((ex) => ex == tt),
              )
            : false;

    if (is_target_type_excluded) {
        log(`Target types [${target_types?.join(",")}] excluded for [${target_type}].`);
        return false;
    }

    const actor_type_set = new Set<string>(
        actor_types.filter((at): at is string => Boolean(at)),
    );

    if (Array.isArray(assignable_by.allowed_actors)) {
        if (!assignable_by.allowed_actors.length) {
            log(`Actor not allowed for [${target_type}], allowed actors list is empty.`);
            return false;
        }

        return assignable_by.allowed_actors.some((actor_type) =>
            actor_type_set.has(actor_type),
        );
    }

    const allowed_actors_matrix = assignable_by.allowed_actors as Record<
        string,
        TypeAssignmentRules | undefined
    >;

    if (!Object.keys(allowed_actors_matrix).length) {
        log(`No allowed actors matrix for [${target_type}].`);
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
            log(`Actor [${actor_type}] has all access for [${target_type}].`);
            return true;
        }

        if (!actor_rules?.allowed_targets && !actor_rules?.excluded_targets) {
            log(`No actor rules for [${actor_type}] on [${target_type}].`);
            return false;
        }

        if (
            actor_rules.allowed_targets &&
            !actor_rules.allowed_targets.find((t) => target_types?.includes(t))
        ) {
            log(`Target types [${target_types?.join(",")}] not included for [${actor_type}] -> [${target_type}].`);
            return false;
        }

        if (
            actor_rules.excluded_targets &&
            actor_rules.excluded_targets.find((t) => target_types?.includes(t))
        ) {
            log(`Target types [${target_types?.join(",")}] excluded for [${actor_type}] -> [${target_type}].`);
            return false;
        }

        log(`Actor [${actor_type}] granted [${action}] of [${target_type}].`);
        return true;
    });
}
