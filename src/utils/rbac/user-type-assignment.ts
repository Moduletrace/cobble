import type { UserAssignmentFnParams } from "@/src/types";
import {
    UserTypeAssignmentMatrix,
    UserTypeDeletionMatrix,
} from "@/src/dict/user-types-dict";
import isPassThroughUser from "./is-pass-through-user";
import typeAssignment from "./type-assignment";

/**
 * Whether the actor may assign or remove `target_user_type` on a user.
 * Governed by `UserTypeAssignmentMatrix` and `UserTypeDeletionMatrix` and
 * applied symmetrically to granting and removing. Pass-through actors
 * (`super_admin`) can always assign. The interpreter is `typeAssignment`.
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
    return typeAssignment({
        actor_types: (actor_user_types || [])
            .map((ut) => ut.user_type)
            .filter((ut): ut is string => Boolean(ut)),
        pass_through: isPassThroughUser({ user_types: actor_user_types }),
        target_type: target_user_type,
        target_types: target_user_types,
        action,
        assignment_matrix,
        deletion_matrix,
        debug,
    });
}
