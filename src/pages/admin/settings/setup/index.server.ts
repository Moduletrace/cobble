import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { server as modelsServer } from "../models/index.server";

/**
 * Super admins only, with the same data as the Models page: the setup's
 * provider and model steps edit it.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) =>
    await modelsServer(params);
