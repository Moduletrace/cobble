import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";

type Params = {
    req: Request;
};

/**
 * Returns the session user only when they are a super admin.
 */
export default async function grabSuperAdminUser({ req }: Params) {
    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return null;
    }

    /**
     * No includes/excludes: only the `super_admin` bypass passes.
     */
    if (!checkUserAccess({ user_types }).success) {
        return null;
    }

    return user;
}
