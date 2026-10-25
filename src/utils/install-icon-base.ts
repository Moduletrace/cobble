import { PwaInstallIconRoute, type PwaInstallIcon } from "@/src/data/pwa-data";

type Params = {
    icon?: PwaInstallIcon | null;
};

/**
 * Where the install's own icon set is served, or null for the stock icons
 * under `/icons`.
 */
export default function installIconBase({ icon }: Params) {
    return icon?.version ? `${PwaInstallIconRoute}/${icon.version}` : null;
}
