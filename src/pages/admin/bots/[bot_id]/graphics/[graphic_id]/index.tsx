import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import GraphicPageSection from "./(sections)/graphic-page-section";

export default function AdminBotGraphicPage() {
    return <GraphicPageSection />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const graphic = (params.serverRes?.props as PagePropsType | undefined)?.graphic;

    return {
        title: `${graphic?.title || "Graphic"} | ${SiteData["SiteName"]}`,
        description: graphic ? `A graphic by ${graphic.bot_name}.` : "A graphic a bot made.",
    };
};
