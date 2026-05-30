import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "usi_admin";

/** Token derivato dalla password (non salviamo la password in chiaro nel cookie). */
export function tokenFor(pwd: string): string {
  return crypto.createHash("sha256").update("usi-admin:" + pwd).digest("hex");
}

export function expectedToken(): string {
  return tokenFor(process.env.ADMIN_PASSWORD || "cuneo2026");
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expectedToken();
}
