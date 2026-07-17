import { getVehicleById } from "@/lib/vehicles-db";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import { notFound } from "next/navigation";
import Link from "next/link";
import React from "react";
import { UserMenu } from "@/components/auth/UserMenu";

// Simple custom SVG components for spec highlights
const CheckIcon = () => (
  <svg className="text-emerald-500 w-5 h-5 flex-shrink-0 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const taxData = calculateNepalOnRoadPrice({
    category: vehicle.type === "Electric" ? "EV" : "ICE_" + vehicle.type,
    engineCc: vehicle.batteryKwh || 0,
    basePriceNPR: vehicle.price,
  });

  const parsedFeatures = vehicle.keyFeatures || [];

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-blue-600 tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
            </svg>
            <span>SaaS Nepal</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Find cars</Link>
            <Link href="/#used-marketplace" className="hover:text-blue-600 transition-colors">Used car</Link>
            <UserMenu signInClassName="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs transition-all" />
          </div>
        </div>
      </header>

      {/* Main Details Body */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-grow flex flex-col gap-6">
        
        {/* Back Link */}
        <div>
          <Link 
            href="/" 
            className="text-slate-500 hover:text-slate-700 font-extrabold text-xs inline-flex items-center gap-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            &larr; Back to Listings
          </Link>
        </div>

        {/* Hero Specs Card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Cover Header */}
          <div className="bg-slate-950 text-white p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            {/* Background design */}
            <div className="absolute -right-24 -bottom-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
            
            <div className="z-10">
              <span className="inline-block px-3.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-3 border border-blue-500/20">
                {vehicle.brand}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{vehicle.model}</h1>
              <p className="text-sm md:text-base text-slate-400 font-bold mt-1.5">{vehicle.variant}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center min-w-[240px] z-10 shadow-lg">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-0.5">Est. On-Road Price (NPR)</p>
              <p className="text-3xl font-black text-emerald-400">
                Rs. {Math.round(taxData.totalOnRoadPrice).toLocaleString("en-NP")}
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Specifications & Features */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              
              {/* Specs Grid */}
              <section>
                <h2 className="text-xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-3">Key Specifications</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <SpecItem label="Category" value={vehicle.category} />
                  <SpecItem label="Body Type" value={vehicle.type} />
                  <SpecItem label="Fuel Type" value={vehicle.fuel} />
                  <SpecItem label="Battery Capacity" value={`${vehicle.batteryKwh} kWh`} />
                  <SpecItem label="Motor Power" value={`${vehicle.horsepower} kW`} />
                  <SpecItem label="Torque" value={vehicle.torqueLabel ? vehicle.torqueLabel : `${vehicle.torque} Nm`} />
                  <SpecItem label="Range" value={`${vehicle.rangeKm} Km`} />
                  <SpecItem label="Transmission" value={vehicle.transmission} />
                  <SpecItem label="Ground Clearance" value={`${vehicle.groundClearance} mm`} />
                  <SpecItem label="Seating Capacity" value={`${vehicle.seatingCapacity} People`} />
                  <SpecItem label="Boot Space" value={vehicle.bootSpace ? `${vehicle.bootSpace} Liters` : "N/A"} />
                  <SpecItem label="Safety Rating" value={vehicle.safetyRating ? `${vehicle.safetyRating} Stars` : "N/A"} />
                </div>
              </section>

              {/* Highlights */}
              <section>
                <h2 className="text-xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-3">Highlighted Features</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-slate-700 text-sm font-semibold bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right Column: Taxes Breakdown */}
            <div className="flex flex-col gap-6">
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-extrabold text-slate-900 mb-4 text-base tracking-tight">Nepal Tax Breakdown</h3>
                
                <div className="flex flex-col gap-3 text-xs font-bold text-slate-600">
                  <TaxRow label="Base Price (Ex-Showroom)" amount={taxData.basePrice} />
                  <TaxRow label="Customs Duty" amount={taxData.customsDuty} />
                  <TaxRow label="Excise Duty" amount={taxData.exciseDuty} />
                  <TaxRow label="VAT (13%)" amount={taxData.vat} />
                  <TaxRow label="Road Tax estimate" amount={taxData.roadTax} />
                  
                  <div className="border-t border-slate-200 my-2 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Total On-Road Price</span>
                    <span className="text-emerald-600 text-base">
                      Rs. {Math.round(taxData.totalOnRoadPrice).toLocaleString("en-NP")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm text-center flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Showroom Partner Offer</span>
                <h4 className="font-extrabold text-slate-800 text-sm">Need loan financing?</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">EMI estimates start from Rs. 28,950/mo based on standard terms.</p>
                <Link 
                  href={`/`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 mt-2 block"
                >
                  Calculate EMI Offer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12 w-full text-center flex flex-col gap-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">EV Price List</Link>
          <Link href="/" className="hover:text-blue-600 transition-colors">Electric Cars</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Electric Scooters</Link>
          <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">EMI Calculator</Link>
          <Link href="/#used-marketplace" className="hover:text-blue-600 transition-colors">Used EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Brands</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Charging Stations</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">News</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Community</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">About</Link>
        </div>
        <div className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{label}</span>
      <span className="text-xs font-bold text-slate-700 mt-1 block">{value}</span>
    </div>
  );
}

function TaxRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-700">Rs. {Math.round(amount).toLocaleString("en-NP")}</span>
    </div>
  );
}
