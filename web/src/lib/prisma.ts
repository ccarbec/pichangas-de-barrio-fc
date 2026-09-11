import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Mismo patrón que tienda-virtual: adapter-libsql apuntando a un archivo
// local durante desarrollo. El día del lanzamiento, DATABASE_URL cambia a
// la URL de Turso (+ TURSO_AUTH_TOKEN) y no hay que tocar código.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
