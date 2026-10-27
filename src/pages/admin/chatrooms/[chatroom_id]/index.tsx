import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import ChatroomView from "./(sections)/chatroom-view";

export default function ChatroomPage() {
    return <ChatroomView />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const chatroom = (params.serverRes?.props as PagePropsType | undefined)?.chatroom;

    return {
        title: `${chatroom?.title || "Chatroom"} | ${SiteData["SiteName"]}`,
        description: `A request between bots, through the coordinator.`,
    };
};
