import { prisma } from "../src/lib/db";
import { hashPassword, normalizeUsername } from "../src/lib/password";

async function readPassword(): Promise<string> {
  process.stdout.write("Password (12–128 characters): ");
  if (!process.stdin.isTTY) {
    let input = "";
    for await (const chunk of process.stdin) input += chunk.toString();
    process.stdout.write("\n");
    return input.replace(/\r?\n$/, "");
  }
  const input = process.stdin;
  input.setRawMode(true);
  input.resume();
  try {
    return await new Promise<string>((resolve, reject) => {
      let password = "";
      const onData = (chunk: Buffer) => {
        for (const key of chunk.toString()) {
          if (key === "\r" || key === "\n") {
            input.off("data", onData);
            process.stdout.write("\n");
            resolve(password);
            return;
          }
          if (key === "\u0003") {
            input.off("data", onData);
            reject(new Error("Cancelled"));
            return;
          }
          if (key === "\u007f") password = Array.from(password).slice(0, -1).join("");
          else if (key >= " ") password += key;
        }
      };
      input.on("data", onData);
    });
  } finally {
    input.setRawMode(false);
    input.pause();
  }
}

async function main() {
  try {
    const [command, rawUsername] = process.argv.slice(2);
    if (command !== "bootstrap" && command !== "reset") throw new Error("Usage: npm run auth:owner -- bootstrap <username> | reset");
    const username = command === "bootstrap" ? normalizeUsername(rawUsername) : null;
    if (command === "bootstrap" && !username) throw new Error("Username must be 3–32 characters: a–z, 0–9, _ or -");
    process.stdout.write(`Database: ${process.env.TURSO_DATABASE_URL ? "Turso" : "local SQLite"}\n`);
    const passwordHash = await hashPassword(await readPassword());
    if (command === "bootstrap") {
      await prisma.$transaction(async (tx) => {
        if (await tx.user.count()) throw new Error("Users already exist; refusing to bootstrap twice");
        const owner = await tx.user.create({ data: { username: username!, passwordHash, isOwner: true } });
        await tx.meter.updateMany({ where: { ownerId: null }, data: { ownerId: owner.id } });
      });
      process.stdout.write("Owner created; existing meters and their readings and tariffs assigned.\n");
    } else {
      const owner = await prisma.user.findFirst({ where: { isOwner: true } });
      if (!owner) throw new Error("No owner exists");
      await prisma.$transaction([
        prisma.user.update({ where: { id: owner.id }, data: { passwordHash, mustChangePassword: true, failedLogins: 0, lockedUntil: null } }),
        prisma.session.deleteMany({ where: { userId: owner.id } }),
      ]);
      process.stdout.write("Owner password reset; all owner sessions revoked.\n");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
