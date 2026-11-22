import { AppData } from "@/src/data/app-data";
import { ConnectorActionsPerRunSettingKey } from "@/src/dict/connector-dict";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "../app-settings/grab-app-setting";

/**
 * How many connector actions one run may take, to any provider: the
 * install's own number (Settings > Connectors), else
 * `AppData.ConnectorActionsPerRun`. A provider bills per action, so a run
 * that searches in a loop costs money per call.
 */
export default async function grabConnectorActionsPerRun() {
    return readStepLimit({
        saved: await grabAppSetting({ key: ConnectorActionsPerRunSettingKey }),
        fallback: AppData.ConnectorActionsPerRun,
        max: AppData.ConnectorActionsPerRunMax,
    });
}