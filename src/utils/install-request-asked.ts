import type { InstallPackageManager } from "@/src/dict/install-request-dict";

/**
 * A request's packages in one line, e.g. "apt: jq, ripgrep; pip: rich".
 */
export default function installRequestAsked({ packages }: { packages: { manager: InstallPackageManager; name: string }[] }) {
    const groups = new Map<string, string[]>();

    for (const item of packages) groups.set(item.manager, [...(groups.get(item.manager) || []), item.name]);

    return [...groups].map(([manager, names]) => `${manager}: ${names.join(", ")}`).join("; ");
}
