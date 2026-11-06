import {
    InstallPackageManagers,
    InstallPackageNamePattern,
    type InstallPackageManager,
} from "@/src/dict/install-request-dict";

/**
 * A stored request's packages (`install_requests.packages`), keeping only
 * well-formed entries.
 */
export default function parseInstallPackages({ text }: { text?: string | null }) {
    try {
        const parsed = JSON.parse(text || "[]");

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is { manager: InstallPackageManager; name: string } =>
                InstallPackageManagers.includes(item?.manager) &&
                typeof item?.name == "string" &&
                InstallPackageNamePattern.test(item.name),
        );
    } catch {
        return [];
    }
}
