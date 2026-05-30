import "server-only";
import { PrismaClient } from "@prisma/client";

// Singleton per evitare connessioni multiple in sviluppo (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
