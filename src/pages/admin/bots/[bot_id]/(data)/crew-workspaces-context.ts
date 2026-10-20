import React from "react";
import type { WorkspaceWithActivity } from "@/src/types";

/**
 * The live workspaces the user is in, so a workspace named in a message
 * links to it and the composer can mention it.
 */
export const CrewWorkspacesContext = React.createContext<WorkspaceWithActivity[]>([]);
