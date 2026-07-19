import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const STATS = [
  { label: "Vehicles tracked", value: "35+" },
  { label: "EV & petrol brands", value: "20+" },
  { label: "Used & rental listings", value: "Live marketplace" },
];

const SECTIONS = [
  {
    title: "Price catalog & comparisons",
    body:
      "Browse EV and petrol car prices in Nepal with real specs — battery, range, power, safety rating — and Nepal-specific on-road pricing that accounts for customs, excise, VAT, and road tax. Put any two cars side by side on the Compare page to see specs and pricing head-to-head.",
  },
  {
    title: "EMI & affordability tools",
    body:
      "Every vehicle page includes an EMI calculator so you can estimate your monthly installment against a down payment and interest rate before you talk to a dealer.",
  },
  {
    title: "Used car & rental marketplace",
    body:
      "Individuals and dealers can list used cars for sale or for rent directly — photos, condition, battery health for EVs, and contact details — and buyers or renters can reach out or request a rental without a middleman.",
  },
  {
    title: "Test drives & notifications",
    body:
      "Buyers can book a test drive on any listing; the owner is notified instantly. Signed-in users get a notification bell for booking updates and rental request decisions.",
  },
  {
    title: "Built for the Nepali market",
    body:
      "Tax and duty calculations, NPR pricing, and local seller conventions (individual vs. dealer, Kathmandu-valley-first locations) are built in rather than adapted from a global template.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-grow flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">About</span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            SaaS Nepal
          </h1>
          <p className="mt-3 text-base font-medium text-slate-500">
            A single place to research, compare, and buy or rent a car in Nepal — new or used,
            electric or petrol — without digging through a dozen dealership websites and Facebook groups.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200/70 bg-white p-5 text-center shadow-sm">
              <div className="text-2xl font-black text-blue-600">{s.value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">{s.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <p className="text-sm font-bold text-slate-700">Have a question, correction, or partnership idea?</p>
          <Link
            href="/contact"
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 motion-reduce:hover:translate-y-0"
          >
            Get in touch
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
