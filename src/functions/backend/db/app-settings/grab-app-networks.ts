import { AppExtraNetworksSettingKey } from "@/src/dict/app-network-dict";
import parseAppNetworks from "@/src/utils/parse-app-networks";
import grabAppSetting from "./grab-app-setting";

/**
 * The extra docker networks the app's own container joins
 * (`app_extra_networks`, Settings > General).
 */
export default async function grabAppNetworks() {
    return parseAppNetworks({ value: await grabAppSetting({ key: AppExtraNetworksSettingKey }) });
}
