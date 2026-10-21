import grabAppSettings from "./grab-app-settings";

type Params = {
    key: string;
};

/**
 * One install-wide setting, or undefined when it was never saved.
 */
export default async function grabAppSetting({ key }: Params) {
    return (await grabAppSettings()).get(key);
}
