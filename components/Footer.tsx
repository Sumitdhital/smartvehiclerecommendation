import Link from "next/link";

/** Shared site footer — same link row + copyright on every page. */
export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 mt-12 w-full text-center flex flex-col gap-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-semibold text-slate-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">Vehicle Price List</Link>
        <Link href="/" className="hover:text-blue-600 transition-colors">Electric Cars</Link>
        <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare EVs</Link>
        <Link href="/used" className="hover:text-blue-600 transition-colors">Used EVs</Link>
        <Link href="/rentals" className="hover:text-blue-600 transition-colors">Rentals</Link>
        <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
        <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
      </div>
      <div className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
        Copyright © 2026 SaaS Nepal. All rights reserved.
      </div>
    </footer>
  );
}
