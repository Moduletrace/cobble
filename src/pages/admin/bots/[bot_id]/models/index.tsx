import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import BotModelsSection from "./(sections)/bot-models-section";

export default function BotModelsPage() {
    return <BotModelsSection />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const bot = (params.serverRes?.props as PagePropsType | undefined)?.bot;

    return {
        title: `${bot?.name || "Bot"} models | ${SiteData["SiteName"]}`,
        description: `Which models ${bot?.name || "this bot"} uses.`,
    };
};
