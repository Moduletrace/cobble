import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { decrypt, encrypt } from "./crypt";

const original_key = process.env.ENCRYPTION_KEY;
const original_salt = process.env.ENCRYPTION_SALT;

beforeEach(() => {
    process.env.ENCRYPTION_KEY = "test-key-1234567890";
    process.env.ENCRYPTION_SALT = "test-salt-1234567890";
});

afterEach(() => {
    if (original_key) process.env.ENCRYPTION_KEY = original_key;
    else delete process.env.ENCRYPTION_KEY;
    if (original_salt) process.env.ENCRYPTION_SALT = original_salt;
    else delete process.env.ENCRYPTION_SALT;
});

describe("encrypt/decrypt", () => {
    test("round-trips plain text", async () => {
        const text = "hello world";
        const encrypted = await encrypt(text);
        expect(encrypted).not.toBe(text);
        expect(await decrypt(encrypted)).toBe(text);
    });

    test("round-trips unicode and long strings", async () => {
        const text = "hello 世界 🎉 " + "x".repeat(5000);
        expect(await decrypt(await encrypt(text))).toBe(text);
    });

    test("round-trips empty strings", async () => {
        expect(await decrypt(await encrypt(""))).toBe("");
    });

    test("produces unique ciphertext per call", async () => {
        const text = "same plaintext";
        const a = await encrypt(text);
        const b = await encrypt(text);
        expect(a).not.toBe(b);
    });

    test("decrypt fails on tampered input", async () => {
        const encrypted = await encrypt("secret");
        const tampered = "A" + encrypted.slice(1);
        expect(async () => await decrypt(tampered)).toThrow();
    });
});