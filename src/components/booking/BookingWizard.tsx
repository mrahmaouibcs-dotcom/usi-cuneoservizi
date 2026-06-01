"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";
import { serviceIds, serviceDuration, isServiceId, type ServiceId } from "@/lib/services";
import { getSlots, hasAnySlot, isPastDay, isWeekend, dateKey } from "@/lib/booking";
import {
  ArrowRight,
  Calendar,
  Check,
  User,
  Phone,
  Mail,
  Pin,
  WhatsApp,
  IconCaf,
  IconPatronato,
  IconSindacato,
  IconLingua,
  Globe,
  IconLegale,
  IconTutela,
} from "@/components/icons";

const SERVICE_ICON: Record<ServiceId, (p: { className?: string }) => React.ReactElement> = {
  caf: IconCaf,
  patr: IconPatronato,
  sind: IconSindacato,
  lang: IconLingua,
  immig: Globe,
  legal: IconLegale,
  tutela: IconTutela,
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function BookingWizard({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  const params = useSearchParams();
  const initialService = params.get("service");

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [service, setService] = useState<ServiceId | null>(
    isServiceId(initialService) ? initialService : null
  );
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingId, setBookingId] = useState("");

  // ---- Calendario ----
  const weekdayLabels = useMemo(() => {
    // Lun..Dom localizzati
    const base = new Date(2024, 0, 1); // lunedì 1 gen 2024
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(lang, { weekday: "short" }).format(d);
    });
  }, [lang]);

  const monthTitle = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(viewMonth);

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = (first.getDay() + 6) % 7; // 0 = lunedì
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
    }
    return cells;
  }, [viewMonth]);

  const morning = date ? getSlots(date, "morning") : [];
  const afternoon = date ? getSlots(date, "afternoon") : [];

  const canPrevMonth = startOfMonth(viewMonth).getTime() > startOfMonth(new Date()).getTime();

  // ---- Navigazione passi ----
  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = t("booking.required");
    if (!form.lastName.trim()) e.lastName = t("booking.required");
    if (!form.phone.trim()) e.phone = t("booking.required");
    if (!form.email.trim()) e.email = t("booking.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("booking.invalidEmail");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 3 && !validateDetails()) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canNext =
    (step === 1 && !!service) ||
    (step === 2 && !!date && !!time) ||
    step === 3;

  const reset = () => {
    setDone(false);
    setStep(1);
    setService(null);
    setDate(null);
    setTime(null);
    setForm({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
    setErrors({});
    setSubmitError("");
    setBookingId("");
  };

  const submit = async () => {
    if (!service || !date || !time) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          date: dateKey(date),
          time,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
          locale: lang,
        }),
      });
      if (!res.ok) throw new Error("request_failed");
      const data = await res.json();
      setBookingId(data.id as string);
      setDone(true);
    } catch {
      setSubmitError(t("booking.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const prettyDate = date
    ? new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)
    : "";

  // ---- Schermata di conferma ----
  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-slate-100 shadow-sm p-10">
        <div className="w-16 h-16 mx-auto rounded-full bg-ita-green text-white grid place-items-center shadow-lg shadow-ita-green/30">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="mt-5 font-serif text-2xl font-bold text-ink-900">{t("booking.confirmedTitle")}</h2>
        <p className="mt-2 text-ink-700">{t("booking.confirmedMsg")}</p>
        <div className="mt-6 text-start bg-cream rounded-xl border border-slate-100 p-5 text-sm space-y-2">
          <Row label={t("booking.lblService")} value={service ? t(`svc.${service}.t`) : ""} />
          <Row label={t("booking.lblWhen")} value={`${prettyDate} · ${time}`} />
          <Row label={t("booking.lblName")} value={`${form.firstName} ${form.lastName}`} />
          <Row label={t("booking.lblLocation")} value={site.address} />
          {bookingId && <Row label={t("booking.ref")} value={bookingId} />}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={`${site.whatsappHref}?text=${encodeURIComponent(
              `${t("booking.confirmedTitle")}\n${t("booking.lblService")}: ${service ? t(`svc.${service}.t`) : ""}\n${t("booking.lblWhen")}: ${prettyDate} · ${time}\n${form.firstName} ${form.lastName}\n${t("booking.ref")}: ${bookingId}`
            )}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#25D366] hover:opacity-90 text-white font-bold transition"
          >
            <WhatsApp className="w-5 h-5" />
            {t("booking.whatsappConfirm")}
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-ink-900 hover:bg-ink-800 text-white font-bold transition"
          >
            {t("booking.newBooking")}
          </button>
        </div>
      </div>
    );
  }

  const steps = [t("booking.step1"), t("booking.step2"), t("booking.step3"), t("booking.step4")];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2 mb-8">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const complete = n < step;
          return (
            <li key={label} className="flex-1 flex items-center gap-2">
              <span
                className={`w-9 h-9 shrink-0 grid place-items-center rounded-full text-sm font-bold transition ${
                  complete
                    ? "bg-ita-green text-white"
                    : active
                    ? "bg-ink-900 text-white"
                    : "bg-white text-ink-700 border border-slate-300"
                }`}
              >
                {complete ? <Check className="w-4 h-4" /> : n}
              </span>
              <span className={`text-xs sm:text-sm font-semibold ${active ? "text-ink-900" : "text-ink-700"}`}>
                {label}
              </span>
              {n < 4 && <span className="hidden sm:block flex-1 h-px bg-slate-200" />}
            </li>
          );
        })}
      </ol>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        {/* STEP 1 — Servizio */}
        {step === 1 && (
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900 mb-5">{t("booking.chooseService")}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {serviceIds.map((id) => {
                const Icon = SERVICE_ICON[id];
                const selected = service === id;
                return (
                  <button
                    key={id}
                    onClick={() => setService(id)}
                    className={`flex items-start gap-3 text-start p-4 rounded-xl border transition ${
                      selected
                        ? "border-ita-green bg-green-50/60 ring-2 ring-ita-green/30"
                        : "border-slate-200 hover:border-ita-green hover:-translate-y-0.5"
                    }`}
                  >
                    <span className="w-10 h-10 shrink-0 rounded-lg bg-green-50 text-ita-green grid place-items-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-bold text-sm text-ink-900">{t(`svc.${id}.t`)}</span>
                      <span className="block text-xs text-ink-700 mt-0.5">
                        {t("booking.duration")}: {serviceDuration[id]} {t("booking.mins")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — Data e ora */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900 mb-4">{t("booking.chooseDate")}</h2>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  disabled={!canPrevMonth}
                  className="w-9 h-9 grid place-items-center rounded-lg border border-slate-200 text-ink-700 disabled:opacity-30 hover:border-ita-green"
                  aria-label="prev"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <span className="font-semibold text-ink-900 capitalize">{monthTitle}</span>
                <button
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="w-9 h-9 grid place-items-center rounded-lg border border-slate-200 text-ink-700 hover:border-ita-green"
                  aria-label="next"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-700 mb-1">
                {weekdayLabels.map((w, i) => (
                  <span key={i} className="py-1 font-semibold uppercase">{w}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const disabled = isPastDay(d) || isWeekend(d) || !hasAnySlot(d);
                  const selected = date && dateKey(date) === dateKey(d);
                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => {
                        setDate(d);
                        setTime(null);
                      }}
                      className={`h-10 rounded-lg text-sm font-semibold transition ${
                        selected
                          ? "bg-ita-green text-white"
                          : disabled
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-ink-800 hover:bg-green-50"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900 mb-4">{t("booking.chooseTime")}</h2>
              {!date ? (
                <p className="text-sm text-ink-700">{t("booking.selectDateFirst")}</p>
              ) : morning.length === 0 && afternoon.length === 0 ? (
                <p className="text-sm text-ink-700">{t("booking.noSlots")}</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: t("booking.morning"), slots: morning },
                    { label: t("booking.afternoon"), slots: afternoon },
                  ].map((group) => (
                    <div key={group.label}>
                      <div className="text-xs font-bold uppercase tracking-wide text-ink-700 mb-2">{group.label}</div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {group.slots.map((s) => {
                          const selected = time === s.time;
                          return (
                            <button
                              key={s.time}
                              disabled={!s.available}
                              onClick={() => setTime(s.time)}
                              className={`py-2 rounded-lg text-sm font-semibold border transition ${
                                selected
                                  ? "bg-ita-green text-white border-ita-green"
                                  : s.available
                                  ? "border-slate-200 text-ink-800 hover:border-ita-green"
                                  : "border-slate-100 text-slate-300 line-through cursor-not-allowed"
                              }`}
                            >
                              {s.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Dati */}
        {step === 3 && (
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900 mb-5">{t("booking.yourDetails")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("booking.firstName")} icon={<User className="w-4 h-4" />} error={errors.firstName}>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-transparent outline-none text-ink-900"
                />
              </Field>
              <Field label={t("booking.lastName")} icon={<User className="w-4 h-4" />} error={errors.lastName}>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-transparent outline-none text-ink-900"
                />
              </Field>
              <Field label={t("booking.email")} icon={<Mail className="w-4 h-4" />} error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-transparent outline-none text-ink-900"
                />
              </Field>
              <Field label={t("booking.phone")} icon={<Phone className="w-4 h-4" />} error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-transparent outline-none text-ink-900"
                />
              </Field>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-ink-800 mb-1">{t("booking.notes")}</label>
              <textarea
                rows={3}
                placeholder={t("booking.notesPh")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-ita-green text-ink-900"
              />
            </div>
          </div>
        )}

        {/* STEP 4 — Riepilogo */}
        {step === 4 && (
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900 mb-5">{t("booking.summary")}</h2>
            <div className="bg-cream rounded-xl border border-slate-100 p-5 text-sm space-y-3">
              <Row label={t("booking.lblService")} value={service ? t(`svc.${service}.t`) : ""} />
              <Row label={t("booking.lblWhen")} value={`${prettyDate} · ${time}`} />
              <Row label={t("booking.lblName")} value={`${form.firstName} ${form.lastName}`} />
              <Row label={t("booking.email")} value={form.email} />
              <Row label={t("booking.phone")} value={form.phone} />
              <Row label={t("booking.lblLocation")} value={site.address} icon={<Pin className="w-4 h-4 text-ita-green" />} />
              {form.notes && <Row label={t("booking.notes")} value={form.notes} />}
            </div>
          </div>
        )}

        {submitError && (
          <p className="mt-6 text-center text-sm font-medium text-ita-red bg-red-50 border border-red-100 rounded-lg py-2 px-3">
            {submitError}
          </p>
        )}

        {/* Navigazione */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-ink-800 font-semibold disabled:opacity-30 hover:border-ink-700 transition"
          >
            {t("booking.back")}
          </button>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className="btn-sheen inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-ita-green hover:bg-ita-green-dark text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("booking.next")}
              <ArrowRight className="w-4 h-4 rtl:scale-x-[-1]" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="btn-sheen inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-ita-red hover:bg-ita-red-dark text-white font-bold transition disabled:opacity-60 disabled:cursor-wait"
            >
              <Calendar className="w-4 h-4" />
              {submitting ? t("booking.submitting") : t("booking.confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-800 mb-1">{label}</label>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-ink-700 ${
          error ? "border-ita-red" : "border-slate-200 focus-within:border-ita-green"
        }`}
      >
        <span className="text-ink-700">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-ita-red font-medium">{error}</p>}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-700 font-medium">{label}</span>
      <span className="text-ink-900 font-semibold text-end flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}
