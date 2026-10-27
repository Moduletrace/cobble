import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import ChatroomView from "@/src/pages/admin/chatrooms/[chatroom_id]/(sections)/chatroom-view";

export default function WorkspaceChatroomPage() {
    return <ChatroomView />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const props = params.serverRes?.props as PagePropsType | undefined;

    return {
        title: `${props?.chatroom?.title || "Chatroom"} | ${props?.workspace?.name || "Workspace"} | ${SiteData["SiteName"]}`,
        description: `A request between this workspace's bots, through the coordinator.`,
    };
};
