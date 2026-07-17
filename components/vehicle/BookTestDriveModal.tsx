"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createTestDriveBooking, TIME_SLOTS } from "@/lib/test-drive";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Human label, e.g. "Kia Sonet 1.5 HTX AT" or "2018 Nissan Leaf". */
  vehicleLabel: string;
  /** Only for community used listings — enables the owner notification. */
  listingId?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function BookTestDriveModal({ open, onClose, vehicleLabel, listingId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Prefill the name from the signed-in account each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setError("");
    setDone(false);
    supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user.user_metadata?.full_name as string | undefined;
      if (name) setFullName((prev) => prev || name);
    });
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 7) return setError("Please enter a valid phone number.");
    if (!preferredDate) return setError("Please pick a preferred date.");

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
      return;
    }

    setSubmitting(true);
    try {
      await createTestDriveBooking(
        {
          vehicleLabel,
          listingId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          preferredDate,
          timeSlot,
          message: message.trim() || undefined,
        },
        data.session.user.id
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl duration-150 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Book a test drive"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Book a Test Drive</h3>
            <p className="mt-0.5 text-sm font-semibold text-slate-500">{vehicleLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="mt-4 text-base font-extrabold text-slate-900">Request sent!</p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {listingId
                ? "The seller has been notified and will reach out to confirm your slot."
                : "We've received your request and will reach out to confirm your slot."}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <Field label="Full name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            </Field>

            <Field label="Phone number">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="98XXXXXXXX"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preferred date">
                <input
                  type="date"
                  value={preferredDate}
                  min={todayISO()}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Time slot">
                <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className={inputCls}>
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Message (optional)">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Anything the seller should know?"
                className={`${inputCls} resize-none`}
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Request Test Drive"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
