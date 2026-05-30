"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, expectedToken, tokenFor } from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const lang = String(formData.get("lang") || "it");
  const pwd = String(formData.get("password") || "");
  if (tokenFor(pwd) === expectedToken()) {
    const store = await cookies();
    store.set(ADMIN_COOKIE, expectedToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 ore
    });
    redirect(`/${lang}/admin`);
  }
  redirect(`/${lang}/admin?error=1`);
}

export async function logoutAction(formData: FormData) {
  const lang = String(formData.get("lang") || "it");
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect(`/${lang}/admin`);
}

export async function setStatusAction(formData: FormData) {
  const lang = String(formData.get("lang") || "it");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath(`/${lang}/admin`);
}

export async function deleteAction(formData: FormData) {
  const lang = String(formData.get("lang") || "it");
  const id = String(formData.get("id"));
  await prisma.booking.delete({ where: { id } });
  revalidatePath(`/${lang}/admin`);
}
