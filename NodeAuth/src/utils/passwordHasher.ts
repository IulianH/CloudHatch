import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const saltSize = 16;
const hashSize = 32;
const iterations = 100_000;

export class PasswordHasher {
  static hash(password: string): string {
    const salt = randomBytes(saltSize);
    const hash = pbkdf2Sync(password, salt, iterations, hashSize, "sha256");

    const iterationStr = iterations.toString();
    const saltB64 = salt.toString("base64");
    const hashB64 = hash.toString("base64");

    return `${iterationStr}.${saltB64}.${hashB64}`;
  }

  static verify(storedHash: string, password: string): boolean {
    const parts = storedHash.split(".", 3);
    if (parts.length !== 3) {
      throw new Error(
        "Unexpected hash format. Should be '{iterations}.{salt}.{hash}'",
      );
    }

    const parsedIterations = Number.parseInt(parts[0], 10);
    const salt = Buffer.from(parts[1], "base64");
    const targetHash = Buffer.from(parts[2], "base64");

    const testHash = pbkdf2Sync(
      password,
      salt,
      parsedIterations,
      targetHash.length,
      "sha256",
    );

    return timingSafeEqual(testHash, targetHash);
  }
}
