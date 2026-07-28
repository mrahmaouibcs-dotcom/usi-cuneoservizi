"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, expectedToken, tokenFor, isAdmin } from "@/lib/admin-auth";
import { isServiceId, serviceDuration } from "@/lib/services";
import { cellsFor } from "@/lib/booking";

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

/**
 * Cambia lo stato di una prenotazione.
 *
 * Attenzione all'agenda: annullare deve LIBERARE la casella oraria, altrimenti
 * gli appuntamenti annullati continuerebbero a bloccare l'agenda per sempre.
 * Al contrario, riportare in vita una prenotazione annullata deve RIOCCUPARE la
 * casella — e può fallire, se nel frattempo qualcun altro l'ha presa.
 */
export async function setStatusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/it/admin");

  const lang = String(formData.get("lang") || "it");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["pending", "confirmed", "cancelled"].includes(status)) redirect(`/${lang}/admin`);

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) redirect(`/${lang}/admin`);

  const eraAnnullata = booking.status === "cancelled";

  if (status === "cancelled") {
    // Annullo: libero le caselle di agenda.
    await prisma.$transaction([
      prisma.bookingSlot.deleteMany({ where: { bookingId: id } }),
      prisma.booking.update({ where: { id }, data: { status } }),
    ]);
  } else if (eraAnnullata) {
    // Ripristino: devo riprendermi le caselle, se sono ancora libere.
    if (!isServiceId(booking.service)) redirect(`/${lang}/admin`);
    const cells = cellsFor(booking.time, serviceDuration[booking.service]);
    try {
      await prisma.$transaction([
        prisma.bookingSlot.createMany({
          data: cells.map((c) => ({
            key: `${booking.date}T${c}`,
            date: booking.date,
            time: c,
            bookingId: id,
          })),
        }),
        prisma.booking.update({ where: { id }, data: { status } }),
      ]);
    } catch {
      // Casella già presa da un'altra prenotazione: non si ripristina.
      redirect(`/${lang}/admin?err=occupato`);
    }
  } else {
    // Passaggio fra "in attesa" e "confermata": l'agenda non cambia.
    await prisma.booking.update({ where: { id }, data: { status } });
  }

  revalidatePath(`/${lang}/admin`);
}

export async function deleteAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/it/admin");

  const lang = String(formData.get("lang") || "it");
  const id = String(formData.get("id"));
  // Le caselle di agenda spariscono con la prenotazione (onDelete: Cascade).
  await prisma.booking.delete({ where: { id } });
  revalidatePath(`/${lang}/admin`);
}
