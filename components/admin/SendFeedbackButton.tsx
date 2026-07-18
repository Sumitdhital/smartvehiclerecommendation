"use client";

import React, { useEffect, useState } from "react";

export type FeedbackTarget = "used_listing" | "rental_listing" | "vehicle";

interface Props {
  target: FeedbackTarget;
  id: string;
  // Human label for the owner/listing, shown in the modal header for context.
  label?: string;
}

// Per-row "Send feedback" action for the admin panel. Opens a small modal that
// posts an admin-composed message to /api/admin/notify-user, which delivers it
// to the listing/vehicle owner's notification bell (type: 'admin_feedback').
export default function SendFeedbackButton({ target, id, label }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const openModal = () => {
    setTitle("");
    setMessage("");
    setError("");
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, id, title: title.trim(), body: message.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to send feedback.");
      setOpen(false);
      setToast({ kind: "success", text: "Feedback sent to the owner." });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send feedback.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs font-bold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all"
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Send feedback</h2>
                {label && <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">{label}</p>}
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center transition-all text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col overflow-hidden">
              <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-medium text-slate-500 leading-snug">
                  This message is delivered to the owner&apos;s notification bell instantly.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fb-title" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Title<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    id="fb-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Please add more photos"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fb-message" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Message<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your listing looks great, but the photos are low resolution…"
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-y"
                  />
                </div>
              </div>

              {error && (
                <div className="mx-6 mb-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70]">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-bold border ${
              toast.kind === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-red-600 text-white border-red-500"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </>
  );
}
