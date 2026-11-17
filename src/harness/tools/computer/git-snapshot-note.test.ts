import { describe, expect, test } from "bun:test";
import gitSnapshotNote from "./git-snapshot-note";

describe("gitSnapshotNote", () => {
    test("says nothing when nothing was saved", () => {
        expect(gitSnapshotNote({ snapshots: [] })).toBe("");
    });

    test("names the patch and how to apply it back", () => {
        const note = gitSnapshotNote({
            snapshots: [{ top: "/repo", files: 2, patch: "/bot/.cobble/pre-destructive/snap.patch" }],
        });

        expect(note).toContain("2 uncommitted paths saved to /bot/.cobble/pre-destructive/snap.patch");
        expect(note).toContain("snap.patch.files");
        expect(note).toContain("Restore with: git -C '/repo' apply '/bot/.cobble/pre-destructive/snap.patch'");
    });

    test("quotes a path with a space in the restore command (L7)", () => {
        const note = gitSnapshotNote({
            snapshots: [
                { top: "/my repo", files: 1, patch: "/bot dir/.cobble/pre-destructive/my snap.patch" },
            ],
        });

        expect(note).toContain("1 uncommitted path saved");
        expect(note).toContain("Restore with: git -C '/my repo' apply '/bot dir/.cobble/pre-destructive/my snap.patch'");
    });
});