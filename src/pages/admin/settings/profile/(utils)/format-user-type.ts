type Params = {
    user_type: string;
};

/**
 * `super_admin` -> `Super admin`.
 */
export default function formatUserType({ user_type }: Params) {
    const words = user_type.trim().replace(/_/g, " ");

    return words.charAt(0).toUpperCase() + words.slice(1);
}
