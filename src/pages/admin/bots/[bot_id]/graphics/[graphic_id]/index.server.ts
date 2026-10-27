import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabGraphicPageProps from "./(functions)/grab-graphic-page-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    return await grabGraphicPageProps(params);
};
