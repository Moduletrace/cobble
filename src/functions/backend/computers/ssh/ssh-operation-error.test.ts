import { describe, expect, it } from "bun:test";
import AppError from "@/src/utils/app-error";
import sshOperationError from "./ssh-operation-error";

const ssh = {
    host: "10.0.0.5",
    port: 22,
    username: "cobble",
    home: "/home/cobble",
    fingerprint: null,
};

describe("sshOperationError", () => {
    it("names the server and what was being done", () => {
        const error = sshOperationError({
            ssh,
            action: "write /home/cobble/.cobble/env-1",
            error: new Error("Failure"),
        });

        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe(
            "Couldn't write /home/cobble/.cobble/env-1 on cobble@10.0.0.5:22: Failure",
        );
    });

    it("keeps an AppError as it is", () => {
        const original = new AppError("No install SSH key found.");

        expect(sshOperationError({ ssh, action: "read", error: original })).toBe(original);
    });

    it("handles a thrown value that is not an Error", () => {
        expect(sshOperationError({ ssh, action: "read", error: "nope" }).message).toBe(
            "Couldn't read on cobble@10.0.0.5:22: nope",
        );
    });
});