import { randomBytes } from "node:crypto";
import { chownSync, writeFileSync } from "node:fs";
import { AgentConfig } from "./config";
import xAuthorityEntry from "./x-authority-entry";

/**
 * A fresh cookie for the X display, readable by gem alone
 * (`AgentConfig.XAuthority`): the display asks for it (`-auth`), and
 * everything run as gem gets it as `XAUTHORITY`.
 */
export default function writeXAuthority() {
    const { XAuthority: file, Display: display, Uid, Gid } = AgentConfig;

    writeFileSync(file, xAuthorityEntry({ display, cookie: randomBytes(16) }), { mode: 0o600 });
    chownSync(file, Uid, Gid);
}
