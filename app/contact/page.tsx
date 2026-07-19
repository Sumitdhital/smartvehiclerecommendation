"use client";

import React, { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { submitContactMessage } from "@/lib/contact";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500";
const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({ name, email, phone, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-grow px-4 py-12 sm:px-6">
        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">Contact</span>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Get in touch</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Questions, corrections, or ideas — send us a message and we&apos;ll get back to you.
        </p>

        {sent ? (
          <div
            role="status"
            className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center"
          >
            <p className="text-lg font-black text-emerald-700">✓ Message sent</p>
            <p className="text-sm font-medium text-emerald-600">
              Thanks, {name.trim().split(" ")[0]} — we&apos;ll be in touch soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={LABEL}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={LABEL}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-phone" className={LABEL}>Phone (optional)</label>
              <input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98XXXXXXXX"
                className={INPUT}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className={LABEL}>
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={5}
                className={`${INPUT} resize-y`}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0"
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
