import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import ChatroomsList from "./(sections)/chatrooms-list";

export default function ChatroomsPage() {
    return <ChatroomsList />;
}

export const meta: BunextPageModuleMetaFn = async () => ({
    title: `Chatrooms | ${SiteData["SiteName"]}`,
    description: `Requests between bots, through the coordinator.`,
});
