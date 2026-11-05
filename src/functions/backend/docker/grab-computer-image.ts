import { AppData } from "@/src/data/app-data";
import grabEnv from "../db/envs/grab-env";

/**
 * The image computers are created with: the `COMPUTER_IMAGE` app setting
 * (a registry mirror, a local build), else `AppData.ComputerImage`.
 */
export default async function grabComputerImage() {
    return (await grabEnv({ key: "COMPUTER_IMAGE" }))?.trim() || AppData.ComputerImage;
}
